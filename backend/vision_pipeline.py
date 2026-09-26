"""
Image studio pipeline: cut out the product and tag it from the foreground.
Uses rembg for the mask and the cutout’s main colour/shape for craft tags.
"""
from __future__ import annotations

from functools import lru_cache

import cv2
import numpy as np
from rembg import new_session, remove


@lru_cache(maxsize=1)
def _session():
    return new_session("u2net")


def check_quality(image_bytes: bytes) -> tuple[bool, str | None]:
    arr = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if arr is None:
        return False, "Invalid image format"
    gray = cv2.cvtColor(arr, cv2.COLOR_BGR2GRAY)
    blurry = cv2.Laplacian(gray, cv2.CV_64F).var() < 80
    dark = float(np.mean(gray)) < 35
    notes = []
    if blurry:
        notes.append("Image is too blurry.")
    if dark:
        notes.append("Image is too dark.")
    return not notes, " ".join(notes) or None


def remove_background(image_bytes: bytes) -> bytes:
    return remove(image_bytes, session=_session())


def generate_tags(cutout_png: bytes) -> dict[str, str]:
    arr = cv2.imdecode(np.frombuffer(cutout_png, np.uint8), cv2.IMREAD_UNCHANGED)
    if arr is None:
        return {"craft_type": "Handicraft", "material": "Mixed", "category": "Home Decor"}

    if arr.ndim == 2 or arr.shape[2] < 4:
        bgr = arr if arr.ndim == 3 else cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        mask = np.ones(bgr.shape[:2], dtype=bool)
    else:
        bgr = arr[:, :, :3]
        mask = arr[:, :, 3] > 24

    if int(mask.sum()) < 60:
        return {"craft_type": "Handicraft", "material": "Mixed", "category": "Home Decor"}

    pixels = bgr[mask].reshape(-1, 3).astype(np.float32)
    if len(pixels) > 6000:
        rng = np.random.default_rng(0)
        pixels = pixels[rng.choice(len(pixels), 6000, replace=False)]
    k = 3 if len(pixels) > 80 else 1
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 25, 0.5)
    _, labels, centers = cv2.kmeans(
        pixels, k, None, criteria, 4, cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=k)
    dominant = centers[int(np.argmax(counts))].astype(np.uint8)
    hsv = cv2.cvtColor(np.uint8([[dominant]]), cv2.COLOR_BGR2HSV)[0, 0]
    hue, sat, val = int(hsv[0]), int(hsv[1]), int(hsv[2])

    ys, xs = np.where(mask)
    width = int(xs.max() - xs.min() + 1)
    height = int(ys.max() - ys.min() + 1)
    aspect = width / max(height, 1)

    mask_u8 = (mask.astype(np.uint8)) * 255
    found = cv2.findContours(mask_u8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = found[0] if len(found) == 2 else found[1]
    circularity = 0.0
    if contours:
        contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(contour)
        peri = cv2.arcLength(contour, True)
        if peri:
            circularity = float(4 * np.pi * area / (peri * peri))

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    texture = float(cv2.Laplacian(gray, cv2.CV_64F)[mask].var())

    if sat < 28 and val > 185:
        craft, material, category = "Weaving", "Cotton", "Apparel"
    elif sat < 32 and val < 70:
        craft, material, category = "Leatherwork", "Leather", "Accessories"
    elif 8 <= hue <= 22 and sat >= 45:
        craft, material = "Pottery", "Terracotta"
        category = "Kitchenware" if circularity > 0.48 else "Home Decor"
    elif 90 <= hue <= 132 and sat >= 40:
        craft, material, category = "Ceramics", "Ceramic", "Home Decor"
    elif 16 <= hue <= 38 and sat >= 70 and val >= 90:
        craft, material, category = "Metalwork", "Brass", "Home Decor"
    elif hue <= 8 or hue >= 160:
        craft, material = "Weaving", "Silk"
        category = "Apparel" if aspect > 1.2 else "Home Decor"
    elif 38 <= hue <= 88:
        craft, material, category = "Basketry", "Wood", "Home Decor"
    elif 8 <= hue <= 28 and sat < 70:
        craft, material = "Woodwork", "Wood"
        category = "Furniture" if aspect > 1.3 else "Home Decor"
    else:
        craft, material, category = "Handicraft", "Mixed", "Home Decor"

    if texture > 900 and sat > 40:
        craft = "Painting"
        category = "Art"
    if circularity > 0.72 and sat >= 40:
        craft = "Pottery"
        if material == "Mixed":
            material = "Terracotta"
        category = "Kitchenware"

    return {"craft_type": craft, "material": material, "category": category}


def process_image(image_bytes: bytes) -> tuple[bytes, bool, str | None, dict[str, str]]:
    quality_passed, feedback = check_quality(image_bytes)
    cutout = remove_background(image_bytes)
    if not cutout.startswith(b"\x89PNG"):
        raise ValueError("Background removal did not return a PNG")
    return cutout, quality_passed, feedback, generate_tags(cutout)
