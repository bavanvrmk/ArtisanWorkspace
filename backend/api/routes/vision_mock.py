"""
Vision & Image Studio API Route — Real Processing Integration
=============================================================
Replaces hardcoded mock with actual vision_studio processing.
Falls back to mock tags if heavy dependencies (torch, rembg) unavailable.
Matches Contract A.
"""
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import importlib.util
import uuid
import os
from pathlib import Path

router = APIRouter()

# Import vision_studio modules using importlib to avoid name collisions
_vs_dir = Path(__file__).resolve().parents[3] / "vision_studio"


def _import_from_vs(module_name: str):
    spec = importlib.util.spec_from_file_location(
        f"vision_studio.{module_name}", _vs_dir / f"{module_name}.py"
    )
    mod = importlib.util.module_from_spec(spec)
    import sys
    old = sys.path.copy()
    sys.path.insert(0, str(_vs_dir))
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.path = old
    return mod

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/process")
async def process_vision(image: UploadFile = File(...)):
    """
    Process an uploaded image: quality check, lighting correction,
    background removal, and auto-tagging.
    Matches API Contract A from COLLABORATION_PLAN.md.
    """
    image_bytes = await image.read()

    if not image_bytes:
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "Empty image file provided"},
        )

    try:
        _processing = _import_from_vs("processing")

        # 1. Quality check
        quality_passed, quality_feedback = _processing.check_quality(image_bytes)

        # 2. Correct lighting
        corrected_bytes = _processing.correct_lighting(image_bytes)

        # 3. Remove background
        processed_bytes = _processing.remove_background(corrected_bytes)

        # Save processed image
        filename = f"{uuid.uuid4()}_processed.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(processed_bytes)

        # 4. Generate tags
        tags = _processing.generate_tags(image_bytes)

        return {
            "status": "success",
            "processed_image_url": f"/uploads/{filename}",
            "quality_passed": quality_passed,
            "quality_feedback": quality_feedback,
            "tags": tags,
        }

    except ImportError as e:
        # Heavy dependencies not available — use mock tags but still save the image
        filename = f"{uuid.uuid4()}_uploaded.png"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return {
            "status": "success",
            "processed_image_url": f"/uploads/{filename}",
            "quality_passed": True,
            "quality_feedback": None,
            "tags": {
                "craft_type": "Pottery",
                "material": "Terracotta",
                "category": "Home Decor",
            },
            "_fallback_reason": f"Vision processing dependencies unavailable: {e}",
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )
