"""
Preview generation utilities.

Generates webp thumbnails for uploaded image files using Pillow. Pillow's
image ops are synchronous/blocking, so actual decode/resize/encode work is
run in a thread via asyncio.to_thread to avoid stalling the event loop.
"""

import asyncio
import logging
from pathlib import Path
from typing import Sequence

from PIL import Image

logger = logging.getLogger(__name__)

PHOTO_EXT_LIST = [
    ".jpg",
    ".jpeg",
    ".jfif",
    ".pjpeg",
    ".pjp",
    ".png",
    ".gif",
    ".webp",
    ".avif",
    ".svg",
    ".svgz",
    ".bmp",
    ".ico",
    ".cur",
]

# Pillow can't decode SVG (vector format, needs a renderer like cairosvg/resvg).
# Everything else in the list is at least attemptable (AVIF needs the
# pillow-avif-plugin package; .ico/.cur support varies by file).
PILLOW_SUPPORTED_EXT = set(PHOTO_EXT_LIST) - {".svg", ".svgz"}

PREVIEW_MAX_SIZE = (512, 512)


def is_previewable(filename: str) -> bool:
    """Whether this filename's extension is one Pillow can attempt to open."""
    return Path(filename).suffix.lower() in PILLOW_SUPPORTED_EXT


def _generate_preview_sync(source_path: str, dest_path: str) -> bool:
    try:
        with Image.open(source_path) as img:
            img.load()
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            img.thumbnail(PREVIEW_MAX_SIZE)
            img.save(dest_path, format="WEBP", quality=80, method=6)
        return True
    except Exception:
        logger.exception("Failed to generate preview for %s", source_path)
        return False


async def generate_preview(source_path: str, dest_path: str) -> bool:
    return await asyncio.to_thread(_generate_preview_sync, source_path, dest_path)
