from contextlib import asynccontextmanager
import os
import time
from typing import Annotated, List
import aiohttp
from fastapi import FastAPI, HTTPException, Header, Path, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import async_db
from s3_client import AsyncS3Client
from consts import ATTACHMENT_EXCLUDE_REPEAT_COUNT
from util import (
    check_token,
    exchange_code,
    get_token_info,
    get_user_from_token,
    refresh_token,
    revoke_access_token,
    verify_token,
)
from models import *
import traceback
from cachetools import TTLCache

token_cache: TTLCache[str, int] = TTLCache(ttl=86400 * 7, maxsize=float("inf"))
attachment_session_cache: TTLCache[str, List[str]] = TTLCache(
    ttl=3600, maxsize=float("inf")
)
session = None
s3_client = None

CURRENT_YEAR = 2024


@asynccontextmanager
async def lifespan(_: FastAPI):
    global session, s3_client
    session = aiohttp.ClientSession()
    s3_client = AsyncS3Client()
    await s3_client.connect()
    await async_db.init()
    yield
    await session.close()
    await s3_client.close()
    await async_db.cleanup()


app = FastAPI(lifespan=lifespan)

def get_current_token(token: Annotated[str | None, Header()] = None) -> str:
    check_token(token_cache, token)
    return token

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello from Sail Wrapped 2024!"}


################## AUTH #################
@app.post("/login")
async def login(request: TokenRequestModel):
    try:
        res = await exchange_code(session, request.code)
        access_token = res["access_token"]
        refresh_token = res["refresh_token"]
        info = await get_token_info(session, access_token)
    except aiohttp.ClientResponseError:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid code or info")

    if not await verify_token(session, access_token):
        raise HTTPException(
            status_code=403, detail="You are not part of the Sail discord server!"
        )

    token_cache[access_token] = info["user"]["id"]
    exp = int(time.time() + res["expires_in"])
    return TokenResponseModel(
        access_token=access_token,
        refresh_token=refresh_token,
        user_info=info["user"],
        exp=exp,
    )


@app.post("/refresh")
async def refresh(
    request: RefreshTokenRequestModel, token: str = Depends(get_current_token)
):
    try:
        res = await refresh_token(session, request.refresh_token)
        new_access_token = res["access_token"]
        info = await get_token_info(session, new_access_token)
        new_refresh_token = res["refresh_token"]

    except aiohttp.ClientResponseError:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Invalid refresh token")

    del token_cache[token]
    token_cache[new_access_token] = info["user"]["id"]
    exp = int(time.time() + res["expires_in"])

    return TokenResponseModel(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user_info=info["user"],
        exp=exp,
    )


@app.post("/logout")
async def logout(token: str = Depends(get_current_token)):
    if token in token_cache:
        del token_cache[token]

    try:
        await revoke_access_token(session, token)
    except:
        pass

    return {"message": "Success"}


###################################


@app.get("/info")
async def user_info(token: str = Depends(get_current_token)):
    try:
        res = await get_token_info(session, token)
        return res["user"]
    except aiohttp.ClientResponseError:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="There was an issue retrieving your user information.",
        )


@app.get("/attachment/random")
async def get_random_attachment(
    video_only: bool = False,
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    if token not in attachment_session_cache:
        attachment_session_cache[token] = []

    attachment = await async_db.get_random_attachment(
        year, attachment_session_cache[token], video_only
    )

    if not attachment:
        raise HTTPException(status_code=404, detail="No attachments found.")

    attachment_session_cache[token].append(attachment.attachment_id)
    if len(attachment_session_cache[token]) > ATTACHMENT_EXCLUDE_REPEAT_COUNT:
        attachment_session_cache[token].pop(0)

    return attachment


@app.get("/attachment/view/{attachment_id}")
async def get_attachment(
    attachment_id: Annotated[int, Path(title="The Attachment ID to retrieve")],
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    attachment = await async_db.get_attachment(year, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachment


@app.get("/message/random")
async def get_random_message(
    min_length: int,
    token: str = Depends(get_current_token),
    links_only: bool = False,
    year: int = CURRENT_YEAR,
):
    if min_length < 1:
        raise HTTPException(
            status_code=400, detail="The minimum length must be at least 1."
        )

    message = await async_db.get_random_message(
        year, min_length=min_length, links_only=links_only
    )
    if not message:
        raise HTTPException(
            status_code=404, detail="There are no messages with that minimum length."
        )
    return message


@app.get("/message/view/{message_id}")
async def get_message(
    message_id: Annotated[int, Path(title="The Messaged ID to retrieve")],
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    message = await async_db.get_message(year, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@app.get("/likes")
async def get_user_likes(
    token: str = Depends(get_current_token), year: int = CURRENT_YEAR
):
    return await async_db.get_likes_for_user(
        year, get_user_from_token(token_cache, token)
    )


@app.post("/like")
async def like(
    request: LikeRequestModel, token: str = Depends(get_current_token)
):
    discord_id = get_user_from_token(token_cache, token)
    await async_db.like(request.id, discord_id, request.is_attachment)
    return {"message": "Success"}


@app.post("/unlike")
async def like(
    request: LikeRequestModel, token: str = Depends(get_current_token)
):
    discord_id = get_user_from_token(token_cache, token)
    await async_db.unlike(request.id, discord_id, request.is_attachment)
    return {"message": "Success"}


@app.get("/leaderboard")
async def leaderboard(
    token: str = Depends(get_current_token), year: int = CURRENT_YEAR
):
    return await async_db.get_leaderboard(year)


@app.get("/stats")
async def stats(
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    discord_id = get_user_from_token(token_cache, token)
    user_stats = await async_db.get_stats(discord_id, year)
    if not user_stats:
        raise HTTPException(status_code=404, detail="No stats found for user.")

    global_stats = await async_db.get_global_stats(year)
    if not global_stats:
        raise HTTPException(status_code=404, detail="No global stats found.")

    notable_content = await async_db.get_notable_content(
        year,
        discord_id,
    )
    return StatsResponseModel(
        user_stats=user_stats,
        global_stats=global_stats,
        notable_content=notable_content,
    )


@app.get("/time_machine/{date}")
async def time_machine(
    date: Annotated[str, Path(title="Date of snapshot in YYYY-MM-DD format")],
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    converted_date = datetime.strptime(date, "%Y-%m-%d")
    return await async_db.get_time_machine_screenshot(converted_date, year)


if __name__ == "__main__":
    port = 5556 if os.environ.get("ENV") == "production" else 8000
    uvicorn.run("main:app", host="0.0.0.0", port=port)


@app.get("/mentions/graph")
async def mention_graph(
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    return await async_db.get_mention_graph(year)


@app.get("/charts")
async def charts(
    token: str = Depends(get_current_token),
    year: int = CURRENT_YEAR,
):
    return await async_db.get_static_buckets(year)


@app.get("/words/search")
async def word_search(
    word: str, token: str = Depends(get_current_token), year: int = CURRENT_YEAR
):
    if len(word) < 1 or len(word) > 50:
        raise HTTPException(
            status_code=400, detail="The word must be 1 to 50 characters."
        )

    if " " in word or "\t" in word or "\n" in word:
        raise HTTPException(
            status_code=400, detail="The word can't have spaces, tabs, or newlines."
        )

    word_data = await async_db.get_word_data(year, word.lower())
    if not word_data or not word_data.buckets:
        raise HTTPException(status_code=404, detail="No data for that word was found.")

    return word_data

@app.get("/drive/list")
async def drive_list(
    prefix: str, token: str = Depends(get_current_token)
) -> List[DriveObject]:
    objects, common_prefixes = await s3_client.list_objects(prefix)
    drive_objects = []
    for common_prefix in common_prefixes:
        if common_prefix != prefix:
            drive_objects.append(DriveObject(key=common_prefix, is_directory=True))
    for object in objects:
        raw_metadata = object.get("Metadata")
        user_info = DriveMetadata(**raw_metadata).to_user_info() if raw_metadata else UserInfo(id="0", username="Unknown", global_name="Unknown")
        drive_objects.append(DriveObject(key=object["Key"], created=object["LastModified"], author=user_info))

    return drive_objects

