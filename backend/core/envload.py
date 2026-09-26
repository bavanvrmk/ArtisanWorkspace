"""Load .env files from repo root, backend/, and voice_listing/."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_KEYS = (
    "BHASHINI_USER_ID",
    "BHASHINI_API_KEY",
    "BHASHINI_PIPELINE_ID",
    "GEMINI_API_KEY",
)


def load_project_env() -> None:
    here = Path(__file__).resolve()
    backend = here.parents[1]
    root = backend.parent
    for path in (root / ".env", backend / ".env", root / "voice_listing" / ".env"):
        if path.exists():
            load_dotenv(path, override=False)
    for key in _KEYS:
        value = os.getenv(key)
        if value:
            os.environ[key] = value.strip().strip('"').strip("'")
