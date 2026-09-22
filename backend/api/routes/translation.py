from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
from pathlib import Path

# Need to import bhashini_client from voice_listing
sys.path.append(str(Path(__file__).resolve().parents[3] / "voice_listing"))
from bhashini_client import BhashiniClient

router = APIRouter()
bhashini = BhashiniClient()

class TranslationRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

@router.post("/")
async def translate_text(req: TranslationRequest):
    if not req.text:
        return {"translated_text": ""}
        
    if req.source_lang == req.target_lang:
        return {"translated_text": req.text}
        
    try:
        translated = bhashini.translate(
            text=req.text,
            source_lang=req.source_lang,
            target_lang=req.target_lang
        )
        return {"translated_text": translated}
    except Exception as e:
        print(f"Translation Error: {e}")
        return {"translated_text": req.text}
