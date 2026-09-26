"""
Vision & Image Studio API Route
================================
Removes the background and tags the product for marketplace listings.
Matches Contract A.
"""
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import asyncio
import os
import uuid

from vision_pipeline import process_image

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _save_bytes(data: bytes, suffix: str) -> str:
    filename = f"{uuid.uuid4()}_{suffix}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(data)
    return filename


@router.post("/process")
async def process_vision(image: UploadFile = File(...)):
    image_bytes = await image.read()
    if not image_bytes:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Empty image file provided"},
        )

    try:
        cutout, quality_passed, feedback, tags = await asyncio.to_thread(
            process_image, image_bytes
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Image processing failed: {exc}"},
        )

    filename = _save_bytes(cutout, "processed.png")
    return {
        "status": "success",
        "processed_image_url": f"/uploads/{filename}",
        "quality_passed": quality_passed,
        "quality_feedback": feedback,
        "tags": tags,
    }
