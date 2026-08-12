"""
Async S3 client wrapper built on aioboto3 (native async, not thread-pool-wrapped).
Preconfigured for the DigitalOcean Spaces bucket used by this project — no
constructor args required for default usage.

Requires: pip install aioboto3

Usage:
    s3 = AsyncS3Client()
    await s3.connect()
    try:
        # keys are automatically prefixed with "sw-drive/"
        await s3.upload_file("local.txt", "remote/key.txt")
        await s3.upload_files([
            ("local1.txt", "remote/key1.txt"),
            ("local2.txt", "remote/key2.txt"),
        ])
    finally:
        await s3.close()
"""

import asyncio
import logging
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import aioboto3
from botocore.config import Config
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from models import DriveObject
from consts import S3_SECRET, S3_ACCESS_KEY

logger = logging.getLogger(__name__)

# Configuration for DigitalOcean Spaces
REGION = "tor1"
ENDPOINT = f"https://{REGION}.digitaloceanspaces.com"
BUCKET_NAME = "redside"
PREFIX = "sw-drive"


class UploadResult(BaseModel):
    local_path: str
    key: str
    success: bool
    error: Optional[str] = None


class UploadJob(BaseModel):
    """Tracks progress of a background upload_files() call."""

    job_id: str
    total: int
    completed: int = 0
    failed: int = 0
    done: bool = False
    results: list = Field(default_factory=list)  # list[UploadResult], filled as they finish

    @property
    def in_progress(self) -> int:
        return self.total - self.completed - self.failed

    @property
    def progress_pct(self) -> float:
        if self.total == 0:
            return 100.0
        return round((self.completed + self.failed) / self.total * 100, 1)


class AsyncS3Client:
    """
    Native async wrapper around aioboto3's S3 client.

    A single client connection is kept open for the lifetime of the
    `async with` block, and is reused across all calls. Concurrency for
    batch operations is bounded by a semaphore (`max_concurrency`) rather
    than a thread pool, since these are real async I/O calls.
    """

    def __init__(
        self,
        bucket: str = BUCKET_NAME,
        region_name: str = REGION,
        max_concurrency: int = 20,
        max_pool_connections: Optional[int] = None,
        endpoint_url: Optional[str] = ENDPOINT,
        key_prefix: str = PREFIX,
        aws_access_key_id: str = S3_ACCESS_KEY,
        aws_secret_access_key: str = S3_SECRET,
        **client_kwargs,
    ):
        self.bucket = bucket
        self.region_name = region_name
        self.endpoint_url = endpoint_url
        self.max_concurrency = max_concurrency
        self.key_prefix = key_prefix.strip("/")
        self.client_kwargs = {
            "aws_access_key_id": aws_access_key_id,
            "aws_secret_access_key": aws_secret_access_key,
            **client_kwargs,
        }

        self._config = Config(
            max_pool_connections=max_pool_connections or max_concurrency,
            retries={"max_attempts": 5, "mode": "adaptive"},
        )

        self._session = aioboto3.Session()
        self._client_ctx = None
        self._s3 = None
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._jobs: dict = {}  # job_id -> UploadJob
        self.job_tasks: dict = {}

    def _prefixed(self, key: str) -> str:
        key = key.lstrip("/")
        if self.key_prefix and not key.startswith(f"{self.key_prefix}/"):
            return f"{self.key_prefix}/{key}"
        return key

    async def connect(self):
        """Open the underlying aioboto3 client. Call once before use."""
        if self._s3 is not None:
            return  # already connected
        self._client_ctx = self._session.client(
            "s3",
            region_name=self.region_name,
            endpoint_url=self.endpoint_url,
            config=self._config,
            **self.client_kwargs,
        )
        self._s3 = await self._client_ctx.__aenter__()

    async def close(self):
        """Close the underlying client. Call when done with this instance."""
        if self._client_ctx is not None:
            await self._client_ctx.__aexit__(None, None, None)
            self._client_ctx = None
            self._s3 = None

    def _require_client(self):
        if self._s3 is None:
            raise RuntimeError(
                "AsyncS3Client is not connected. Call 'await s3.connect()' first."
            )

    # ---------- Single file operations ----------

    async def upload_file(
        self, local_path: str, key: str, extra_args: Optional[dict] = None
    ) -> UploadResult:
        self._require_client()
        key = self._prefixed(key)
        async with self._semaphore:
            try:
                if not extra_args:
                    extra_args = {}

                extra_args.update({'ACL': 'public-read'})
                await self._s3.upload_file(
                    str(local_path), self.bucket, key, ExtraArgs=extra_args
                )
                logger.info(
                    "Uploaded %s -> s3://%s/%s", local_path, self.bucket, key
                )
                return UploadResult(local_path=str(local_path), key=key, success=True)
            except ClientError as e:
                logger.error("Failed to upload %s: %s", local_path, e)
                return UploadResult(
                    local_path=str(local_path), key=key, success=False, error=str(e)
                )

    async def download_file(self, key: str, local_path: str) -> UploadResult:
        self._require_client()
        key = self._prefixed(key)
        async with self._semaphore:
            try:
                Path(local_path).parent.mkdir(parents=True, exist_ok=True)
                await self._s3.download_file(self.bucket, key, str(local_path))
                logger.info(
                    "Downloaded s3://%s/%s -> %s", self.bucket, key, local_path
                )
                return UploadResult(local_path=str(local_path), key=key, success=True)
            except ClientError as e:
                logger.error("Failed to download %s: %s", key, e)
                return UploadResult(
                    local_path=str(local_path), key=key, success=False, error=str(e)
                )

    # ---------- Multi file operations ----------

    async def upload_files(
        self,
        files: Sequence[tuple],  # (local_path, key) pairs
        extra_args: Optional[dict] = None,
    ) -> list:
        """
        Upload multiple files concurrently (bounded by max_concurrency).
        Returns a list of UploadResult in the same order as input.
        Individual failures don't stop the rest of the batch.
        """
        tasks = [
            self.upload_file(local_path, key, extra_args)
            for local_path, key in files
        ]
        return await asyncio.gather(*tasks)

    # ---------- Background job tracking ----------

    def start_upload_job(
        self,
        files: Sequence[tuple],  # (local_path, key) pairs
        extra_args: Optional[dict] = None,
    ) -> str:
        """
        Kick off upload_files() in the background and return a job_id
        immediately. Poll progress with get_job_status(job_id).

        Does not block — this is a sync method that schedules an asyncio
        task on the running event loop, so it must be called from within
        an async context (a running loop).
        """
        job_id = str(uuid.uuid4())
        job = UploadJob(job_id=job_id, total=len(files))
        self._jobs[job_id] = job

        self.job_tasks[job_id] = asyncio.create_task(self._run_upload_job(job, files, extra_args))
        return job_id

    async def _run_upload_job(
        self, job: UploadJob, files: Sequence[tuple], extra_args: Optional[dict]
    ):
        async def _upload_and_track(local_path, key):
            result = await self.upload_file(local_path, key, extra_args)
            if result.success:
                job.completed += 1
            else:
                job.failed += 1
            job.results.append(result)

        await asyncio.gather(
            *(_upload_and_track(local_path, key) for local_path, key in files)
        )
        job.done = True

        if job.job_id in self.job_tasks:
            del self.job_tasks[job.job_id]

        async def clean_up_with_delay():
            await asyncio.sleep(30)
            self.clear_job(job.job_id)

        asyncio.create_task(clean_up_with_delay())

    def get_job_status(self, job_id: str) -> Optional[UploadJob]:
        """Returns the current UploadJob, or None if job_id is unknown."""
        return self._jobs.get(job_id)

    async def wait_for_job(self, job_id: str, poll_interval: float = 0.5) -> UploadJob:
        """Block (async) until the given job finishes, then return it."""
        job = self._jobs.get(job_id)
        if job is None:
            raise KeyError(f"Unknown job_id: {job_id}")
        while not job.done:
            await asyncio.sleep(poll_interval)
        return job

    def clear_job(self, job_id: str):
        """Drop a finished job from memory once you're done polling it."""
        self._jobs.pop(job_id, None)

    async def download_files(self, files: Sequence[tuple]) -> list:
        """files: (key, local_path) pairs"""
        tasks = [self.download_file(key, local_path) for key, local_path in files]
        return await asyncio.gather(*tasks)

    # ---------- Convenience ----------

    async def upload_directory(
        self, local_dir: str, prefix: str = "", pattern: str = "*"
    ) -> list:
        """Upload every file under local_dir (recursively) to bucket/prefix,
        preserving relative paths as the S3 key suffix."""
        local_dir = Path(local_dir)
        pairs = []
        for path in local_dir.rglob(pattern):
            if path.is_file():
                rel = path.relative_to(local_dir).as_posix()
                key = f"{prefix.rstrip('/')}/{rel}" if prefix else rel
                pairs.append((str(path), self._prefixed(key)))
        return await self.upload_files(pairs)

    async def list_objects(self, prefix: str = "") -> Dict:
        """Paginated list, returns list of objects and common prefixes (directories)"""
        self._require_client()
        full_prefix = self._prefixed(prefix) if prefix else self.key_prefix
        objects = []
        common_prefixes = []
        paginator = self._s3.get_paginator("list_objects_v2")
        async for page in paginator.paginate(Bucket=self.bucket, Prefix=full_prefix, Delimiter="/"):
            for object in page.get("Contents", []):
                if object["Key"] != full_prefix:
                    objects.append(object)
            common_prefixes.extend(cp["Prefix"] for cp in page.get("CommonPrefixes", []))

        return objects, common_prefixes

    async def file_exists(self, key: str) -> bool:
        """Check whether a single key exists in the bucket."""
        self._require_client()
        key = self._prefixed(key)
        try:
            await self._s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                return False
            raise

    # ---------- Delete operations ----------

    async def delete_file(self, key: str) -> UploadResult:
        """Delete a single object."""
        self._require_client()
        key = self._prefixed(key)
        try:
            await self._s3.delete_object(Bucket=self.bucket, Key=key)
            logger.info("Deleted s3://%s/%s", self.bucket, key)
            return UploadResult(local_path="", key=key, success=True)
        except ClientError as e:
            logger.error("Failed to delete %s: %s", key, e)
            return UploadResult(local_path="", key=key, success=False, error=str(e))

    async def delete_files(self, keys: Sequence[str]) -> list:
        """
        Delete multiple objects using S3's batch delete_objects API
        (up to 1000 keys per request), chunking automatically and running
        chunks concurrently. Returns a list of UploadResult, one per key.
        """
        self._require_client()
        keys = [self._prefixed(k) for k in keys]

        async def _delete_batch(batch: list) -> tuple:
            async with self._semaphore:
                resp = await self._s3.delete_objects(
                    Bucket=self.bucket,
                    Delete={
                        "Objects": [{"Key": k} for k in batch],
                        "Quiet": False,
                    },
                )
            deleted = {obj["Key"] for obj in resp.get("Deleted", [])}
            errors = {
                err["Key"]: err.get("Message", "Unknown error")
                for err in resp.get("Errors", [])
            }
            return deleted, errors

        results = []
        chunk_size = 1000
        keys = list(keys)
        chunks = [keys[i : i + chunk_size] for i in range(0, len(keys), chunk_size)]

        batch_results = await asyncio.gather(*(_delete_batch(c) for c in chunks))

        for deleted, errors in batch_results:
            for key in deleted:
                results.append(UploadResult(local_path="", key=key, success=True))
            for key, err in errors.items():
                results.append(
                    UploadResult(local_path="", key=key, success=False, error=err)
                )

        return results


# ---------------- Example usage ----------------

async def _example():
    logging.basicConfig(level=logging.INFO)

    s3 = AsyncS3Client()  # uses DO Spaces defaults, no args needed
    await s3.connect()
    try:
        # single file
        result = await s3.upload_file("report.pdf", "reports/report.pdf")
        print(result)

        # multiple files concurrently
        results = await s3.upload_files([
            ("data/a.csv", "datasets/a.csv"),
            ("data/b.csv", "datasets/b.csv"),
            ("data/c.csv", "datasets/c.csv"),
        ])
        for r in results:
            status = "OK" if r.success else f"FAILED: {r.error}"
            print(f"{r.local_path} -> {r.key}: {status}")

        # whole directory
        await s3.upload_directory("data/", prefix="datasets")

        # background job with progress polling
        job_id = s3.start_upload_job([
            ("data/x.csv", "datasets/x.csv"),
            ("data/y.csv", "datasets/y.csv"),
            ("data/z.csv", "datasets/z.csv"),
        ])
        while True:
            status = s3.get_job_status(job_id)
            print(f"progress: {status.progress_pct}% ({status.completed} ok, {status.failed} failed)")
            if status.done:
                break
            await asyncio.sleep(0.5)
        s3.clear_job(job_id)

        # list
        keys = await s3.list_objects(prefix="datasets")
        print(keys)

        # delete single
        await s3.delete_file("datasets/a.csv")

        # delete multiple
        del_results = await s3.delete_files(["datasets/b.csv", "datasets/c.csv"])
        for r in del_results:
            status = "OK" if r.success else f"FAILED: {r.error}"
            print(f"delete {r.key}: {status}")
    finally:
        await s3.close()


if __name__ == "__main__":
    asyncio.run(_example())