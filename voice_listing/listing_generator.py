"""
Listing Generator
=================
Takes a transcript (translated to English) + image tags and produces a
structured JSON listing suitable for marketplace publishing.

Uses Google Gemini when a GEMINI_API_KEY is available; otherwise falls
back to a simple template-based generator.
"""

import json
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent / ".env", override=False)
load_dotenv()

# ── Prompt template for the LLM ─────────────────────────────────────
LISTING_PROMPT = """You are an expert e-commerce listing writer for Indian handicrafts.

Given the following artisan's voice description (translated to English) and image analysis tags,
generate a marketplace-ready product listing.

## Artisan's Description:
{transcript}

## Image Tags:
- Craft Type: {craft_type}
- Material: {material}
- Category: {category}

## Instructions:
1. Write a compelling, SEO-friendly product title (max 80 chars).
2. Write a detailed product description (150-250 words) that highlights craftsmanship, materials, and cultural significance.
3. Generate 8-12 SEO tags as a list.
4. Translate the title and description to Hindi as well.

## Output Format (strict JSON):
{{
  "title": "...",
  "description": "...",
  "seo_tags": ["tag1", "tag2", ...],
  "hindi_title": "...",
  "hindi_description": "..."
}}

Return ONLY valid JSON. No markdown, no explanation.
"""


def _generate_with_gemini(
    transcript: str, craft_type: str, material: str, category: str
) -> dict:
    """Use Google Gemini to generate a listing."""
    try:
        from google import genai

        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("No GEMINI_API_KEY")

        client = genai.Client(api_key=api_key)

        prompt = LISTING_PROMPT.format(
            transcript=transcript,
            craft_type=craft_type,
            material=material,
            category=category,
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        # Parse the JSON from the response
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[: text.rfind("```")]
            text = text.strip()

        return json.loads(text)

    except Exception as e:
        print(f"[INFO] Gemini generation failed ({e}), using template fallback.")
        return None


def _generate_with_template(
    transcript: str, craft_type: str, material: str, category: str
) -> dict:
    """
    Template-based fallback when no LLM is available.
    Produces a reasonable listing from the raw inputs.
    """
    # Build a title from the tags
    spoken = (transcript or "").strip()
    snippet = spoken.split(".")[0].strip()[:48] if spoken else ""
    title = f"{snippet} · {material} {craft_type}" if snippet else f"Handcrafted {material} {craft_type}"
    if spoken:
        description = (
            f"{title} for {category}. "
            f"The maker says: {spoken} "
            f"Crafted in {material} using traditional {craft_type.lower()} methods. "
            f"Each piece is unique."
        )
    else:
        description = (
            f"{title} made with {material} for {category}. "
            "Handmade by an Indian artisan using traditional methods."
        )

    seo_tags = sorted(
        {
            craft_type.lower(),
            material.lower(),
            category.lower(),
            "handmade",
            "handcrafted",
            "artisan",
            "indian craft",
            "traditional",
            f"{material.lower()} {craft_type.lower()}",
            "handicraft",
        }
    )

    return {
        "title": title[:80],
        "description": description,
        "seo_tags": seo_tags,
        "hindi_title": f"हस्तनिर्मित {material} {craft_type}",
        "hindi_description": (
            f"यह {material} {craft_type} भारतीय कारीगर द्वारा हाथ से बनाया गया है। {spoken}"
        ).strip(),
    }


def generate_listing(
    transcript: str,
    image_tags: dict,
) -> dict:
    """
    Generate a structured product listing from a transcript and image tags.

    Parameters
    ----------
    transcript : str
        The artisan's description (ideally translated to English).
    image_tags : dict
        Must contain keys: 'craft_type', 'material', 'category'.

    Returns
    -------
    dict with keys: title, description, seo_tags, hindi_title, hindi_description
    """
    craft_type = image_tags.get("craft_type") or "Handicraft"
    material = image_tags.get("material") or "Mixed"
    category = image_tags.get("category") or "Home Decor"

    result = None
    gemini_key = (os.getenv("GEMINI_API_KEY") or "").strip().strip('"')
    if gemini_key:
        result = _generate_with_gemini(transcript, craft_type, material, category)

    if result is None:
        result = _generate_with_template(transcript, craft_type, material, category)

    return result
