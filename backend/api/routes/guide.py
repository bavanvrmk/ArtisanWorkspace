"""Cached voice-guide audio for Direct mode."""
from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import os

from guide_prompts import GUIDE_KEYS, prompt_text

router = APIRouter()

CACHE = Path("uploads") / "guide"
CACHE.mkdir(parents=True, exist_ok=True)

BHASHINI_TTS = {
    "as",
    "bn",
    "gu",
    "hi",
    "kn",
    "ml",
    "mr",
    "or",
    "pa",
    "sa",
    "ta",
    "te",
    "ur",
}


def _tts_lang(lang: str) -> str:
    return lang if lang in BHASHINI_TTS else "hi"


def _cache_path(lang: str, key: str) -> Path:
    folder = CACHE / lang
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{key}.wav"


@router.get("/prompt/{lang}/{key}")
def get_prompt(lang: str, key: str):
    if key not in GUIDE_KEYS:
        return JSONResponse(status_code=404, content={"message": "Unknown prompt"})
    text = prompt_text(lang, key)
    path = _cache_path(lang, key)
    audio_url = f"/uploads/guide/{lang}/{key}.wav" if path.exists() else None
    return {
        "lang": lang,
        "key": key,
        "text": text,
        "audio_url": audio_url,
        "tts_lang": _tts_lang(lang),
        "cached": path.exists(),
    }


@router.post("/prompt/{lang}/{key}/speak")
def speak_prompt(lang: str, key: str):
    """Generate and cache TTS for this prompt in the user's language."""
    if key not in GUIDE_KEYS:
        return JSONResponse(status_code=404, content={"message": "Unknown prompt"})
    text = prompt_text(lang, key)
    path = _cache_path(lang, key)
    if path.exists() and path.stat().st_size > 100:
        return {
            "lang": lang,
            "key": key,
            "text": text,
            "audio_url": f"/uploads/guide/{lang}/{key}.wav",
            "cached": True,
        }

    try:
        import importlib.util
        import sys

        vl = Path(__file__).resolve().parents[3] / "voice_listing"
        spec = importlib.util.spec_from_file_location(
            "voice_listing.bhashini_client", vl / "bhashini_client.py"
        )
        mod = importlib.util.module_from_spec(spec)
        old = sys.path.copy()
        sys.path.insert(0, str(vl))
        try:
            spec.loader.exec_module(mod)
        finally:
            sys.path = old
        client = mod.BhashiniClient()
        client.text_to_speech(text, lang=_tts_lang(lang), output_path=str(path))
        return {
            "lang": lang,
            "key": key,
            "text": text,
            "audio_url": f"/uploads/guide/{lang}/{key}.wav",
            "cached": True,
        }
    except Exception as exc:
        return {
            "lang": lang,
            "key": key,
            "text": text,
            "audio_url": None,
            "cached": False,
            "use_browser_tts": True,
            "tts_lang": _tts_lang(lang),
            "reason": str(exc),
        }


@router.post("/prefetch/{lang}")
def prefetch_language(lang: str):
    """Cache every Direct-mode prompt for this language."""
    results = []
    for key in GUIDE_KEYS:
        results.append(speak_prompt(lang, key))
    return {"lang": lang, "prompts": results}


@router.get("/audio/{lang}/{key}")
def get_audio(lang: str, key: str):
    path = _cache_path(lang, key)
    if not path.exists():
        return JSONResponse(status_code=404, content={"message": "Not cached"})
    return FileResponse(path, media_type="audio/wav")
