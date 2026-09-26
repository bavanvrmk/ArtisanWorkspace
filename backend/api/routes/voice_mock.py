"""Voice listing: transcribe with Bhashini and write a listing from studio tags."""
from fastapi import APIRouter, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
import importlib.util
import json
import tempfile
import os
from pathlib import Path

from core.envload import load_project_env

load_project_env()

router = APIRouter()
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


def _listing_from_tags(transcript: str, translated: str, tags: dict | None) -> dict:
    tags = tags or {}
    _gen = _import_from_vl("listing_generator")
    listing = _gen.generate_listing(translated or transcript, tags)
    return {
        "transcript": transcript,
        "translated_text": translated,
        "listing": listing,
        "audio_alert_url": None,
        "tags": tags,
    }


@router.post("/listing")
def voice_listing(req: VoiceListingRequest):
    _mock = _import_from_vl("mock_data")
    mock = _mock.mock_listing()
    tags = req.image_tags or {}
    if tags.get("craft_type") or tags.get("material"):
        return _listing_from_tags(mock["transcript"], mock["translated_text"], tags)
    mock["tags"] = tags
    return mock


@router.post("/listing/upload")
async def voice_listing_upload(
    audio: UploadFile = File(...),
    language: str = Form("hi"),
    image_tags: str = Form("{}"),
):
    tags = json.loads(image_tags or "{}")
    audio_bytes = await audio.read()
    suffix = Path(audio.filename or "audio.wav").suffix.lower() or ".wav"

    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        _bhashini = _import_from_vl("bhashini_client")
        client = _bhashini.BhashiniClient()
        speech_lang = language if language in {"hi", "ta", "te"} else "hi"
        stt_result = client.speech_to_text_and_translate(
            tmp_path, source_lang=speech_lang, target_lang="en"
        )
        return _listing_from_tags(
            stt_result.get("transcript", ""),
            stt_result.get("translated_text", ""),
            tags,
        )
    except Exception as e:
        _mock = _import_from_vl("mock_data")
        mock = _mock.mock_listing()
        payload = _listing_from_tags(
            mock["transcript"],
            mock["translated_text"],
            tags,
        )
        payload["_fallback_reason"] = str(e)
        return payload
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("hi"),
):
    audio_bytes = await audio.read()
    suffix = Path(audio.filename or "audio.wav").suffix.lower() or ".wav"
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        _bhashini = _import_from_vl("bhashini_client")
        client = _bhashini.BhashiniClient()
        transcript = client.speech_to_text(tmp_path, source_lang=language)
        return {"transcript": transcript, "source_lang": language}
    except Exception as e:
        _mock = _import_from_vl("mock_data")
        result = _mock.mock_transcribe(language)
        result["_fallback_reason"] = str(e)
        return result
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
