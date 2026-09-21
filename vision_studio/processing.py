import io
import cv2
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from rembg import remove

# Initialize models globally so they are only loaded once
device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "openai/clip-vit-base-patch32"

try:
    processor = CLIPProcessor.from_pretrained(model_id)
    model = CLIPModel.from_pretrained(model_id).to(device)
except Exception as e:
    print(f"Warning: Could not load CLIP model. Tagging will fall back to mock data. Error: {e}")
    processor = None
    model = None

CRAFT_CATEGORIES = [
    "Pottery", "Weaving", "Woodwork", "Metalwork", "Embroidery",
    "Jewelry", "Leatherwork", "Stone Carving", "Painting", "Basketry"
]

MATERIALS = [
    "Terracotta", "Cotton", "Silk", "Wood", "Brass", "Copper",
    "Wool", "Leather", "Stone", "Glass", "Ceramic"
]

PRODUCT_CATEGORIES = [
    "Home Decor", "Apparel", "Jewelry", "Accessories", "Furniture",
    "Kitchenware", "Art", "Toys"
]

def remove_background(image_bytes: bytes) -> bytes:
    """Removes the background from an image using rembg."""
    try:
        output_bytes = remove(image_bytes)
        return output_bytes
    except Exception as e:
        print(f"Error removing background: {e}")
        return image_bytes

def correct_lighting(image_bytes: bytes) -> bytes:
    """Corrects the lighting of an image using OpenCV (Histogram Equalization on the Y channel)."""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return image_bytes
            
        # Convert to YUV color space
        img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
        
        # Equalize the histogram of the Y channel
        img_yuv[:,:,0] = cv2.equalizeHist(img_yuv[:,:,0])
        
        # Convert the YUV image back to RGB format
        img_output = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)
        
        # Encode back to bytes
        success, encoded_image = cv2.imencode('.jpg', img_output)
        if success:
            return encoded_image.tobytes()
        return image_bytes
    except Exception as e:
        print(f"Error correcting lighting: {e}")
        return image_bytes

def check_quality(image_bytes: bytes):
    """
    Checks the quality of the image (blur and darkness).
    Returns (passed, feedback_string).
    """
    try:
        # Convert bytes to numpy array for opencv
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return False, "Invalid image format"

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check blur using Variance of Laplacian
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        is_blurry = laplacian_var < 100 # Threshold can be tuned
        
        # Check darkness (brightness)
        mean_brightness = np.mean(gray)
        is_dark = mean_brightness < 40 # Threshold can be tuned

        feedback = []
        if is_blurry:
            feedback.append("Image is too blurry.")
        if is_dark:
            feedback.append("Image is too dark.")

        passed = not (is_blurry or is_dark)
        feedback_str = " ".join(feedback) if feedback else None
        
        return passed, feedback_str
        
    except Exception as e:
        return False, f"Quality check failed: {e}"

def generate_tags(image_bytes: bytes):
    """Generates tags using CLIP model, or mock data if model failed to load."""
    if model is None or processor is None:
        return {
            "craft_type": "Pottery",
            "material": "Terracotta",
            "category": "Home Decor"
        }
        
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        tags = {}
        
        # Predict craft type
        inputs = processor(text=CRAFT_CATEGORIES, images=image, return_tensors="pt", padding=True).to(device)
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        best_idx = probs.argmax().item()
        tags["craft_type"] = CRAFT_CATEGORIES[best_idx]
        
        # Predict material
        inputs = processor(text=MATERIALS, images=image, return_tensors="pt", padding=True).to(device)
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        best_idx = probs.argmax().item()
        tags["material"] = MATERIALS[best_idx]
        
        # Predict product category
        inputs = processor(text=PRODUCT_CATEGORIES, images=image, return_tensors="pt", padding=True).to(device)
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        best_idx = probs.argmax().item()
        tags["category"] = PRODUCT_CATEGORIES[best_idx]
        
        return tags
    except Exception as e:
        print(f"Tag generation failed: {e}")
        return {
            "craft_type": "Unknown",
            "material": "Unknown",
            "category": "Unknown"
        }
