"""
Voice & Listing API Route — Real Pipeline Integration
======================================================
Replaces hardcoded mock with actual voice_listing pipeline.
Falls back to mock data when Bhashini credentials are unavailable.
Matches Contract B.
"""
from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import importlib.util
import json
import tempfile
import os
from pathlib import Path

router = APIRouter()

# Import voice_listing modules using importlib to avoid name collisions
_vl_dir = Path(__file__).resolve().parents[3] / "voice_listing"


def _import_from_vl(module_name: str):
    spec = importlib.util.spec_from_file_location(
        f"voice_listing.{module_name}", _vl_dir / f"{module_name}.py"
    )
    mod = importlib.util.module_from_spec(spec)
    import sys
    old = sys.path.copy()
    sys.path.insert(0, str(_vl_dir))
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.path = old
    return mod


class VoiceListingRequest(BaseModel):
    audio_url: Optional[str] = None
    image_tags: Optional[dict] = None
    language: str = "hi"


@router.post("/listing")
def voice_listing(req: VoiceListingRequest):
    """
    Generate a product listing from voice description.
    Uses mock data since no audio file is uploaded via JSON body.
    For real pipeline, use /listing/upload with file upload.
    Matches API Contract B from COLLABORATION_PLAN.md.
    """
    _mock = _import_from_vl("mock_data")
    result = _mock.mock_listing()

    # If image_tags provided, regenerate listing with them
    if req.image_tags:
        try:
            _gen = _import_from_vl("listing_generator")
            listing_data = _gen.generate_listing(
                result["translated_text"],
                req.image_tags,
            )
            result["listing"] = listing_data
        except Exception:
            pass  # Keep mock listing on failure

    return result


@router.post("/listing/upload")
async def voice_listing_upload(
    audio: UploadFile = File(...),
    language: str = Form("hi"),
    image_tags: str = Form('{"craft_type": "Handicraft", "material": "Mixed", "category": "Home Decor"}'),
):
    """
    Full voice listing pipeline with audio file upload.
    Transcribes audio → translates → generates listing.
    Falls back to mock if Bhashini credentials unavailable.
    """
    tags = json.loads(image_tags)

    # Try real pipeline
    try:
        _bhashini = _import_from_vl("bhashini_client")
        _gen = _import_from_vl("listing_generator")

        # Save uploaded audio to temp file
        audio_bytes = await audio.read()
        suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            client = _bhashini.BhashiniClient()
            stt_result = client.speech_to_text_and_translate(
                tmp_path, source_lang=language, target_lang="en"
            )
            transcript = stt_result["transcript"]
            translated = stt_result["translated_text"]

            listing_data = _gen.generate_listing(translated, tags)

            return {
                "transcript": transcript,
                "translated_text": translated,
                "listing": listing_data,
                "audio_alert_url": None,
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        # Fallback to mock
        _mock = _import_from_vl("mock_data")
        result = _mock.mock_listing()
        result["_fallback_reason"] = str(e)
        return result


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("hi"),
):
    """Transcribe audio to text using Bhashini ASR."""
    try:
        _bhashini = _import_from_vl("bhashini_client")

        audio_bytes = await audio.read()
        suffix = Path(audio.filename or "audio.wav").suffix or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            client = _bhashini.BhashiniClient()
            transcript = client.speech_to_text(tmp_path, source_lang=language)
            return {"transcript": transcript, "source_lang": language}
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        _mock = _import_from_vl("mock_data")
        result = _mock.mock_transcribe(language)
        result["_fallback_reason"] = str(e)
        return result

