import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from processing import remove_background, check_quality, generate_tags, correct_lighting

app = FastAPI(title="Vision & Image Studio API")

STORAGE_DIR = "storage/images"
os.makedirs(STORAGE_DIR, exist_ok=True)

@app.post("/api/vision/process")
async def process_image(image: UploadFile = File(...)):
    """
    Processes an uploaded image: removes background, checks quality, and generates tags.
    Matches API Contract A in COLLABORATION_PLAN.md.
    """
    try:
        image_bytes = await image.read()
        
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image file provided")

        # 1. Check quality
        quality_passed, quality_feedback = check_quality(image_bytes)
        
        # 2. Correct Lighting
        corrected_bytes = correct_lighting(image_bytes)
        
        # 3. Remove background
        processed_bytes = remove_background(corrected_bytes)
        
        # Save processed image (mocking storage upload)
        filename = f"{uuid.uuid4()}_processed.png"
        filepath = os.path.join(STORAGE_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(processed_bytes)
            
        # 4. Generate tags
        tags = generate_tags(image_bytes)
        
        return JSONResponse(content={
            "status": "success",
            "processed_image_url": f"http://localhost:8000/storage/images/{filename}",
            "quality_passed": quality_passed,
            "quality_feedback": quality_feedback,
            "tags": tags
        })
        
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })

# Serve static files for mock image storage
from fastapi.staticfiles import StaticFiles
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
