"""
Artisan Workspace — FastAPI Backend
====================================
Unified API server integrating all workstreams:
  - Auth (mock login for CLI-first phase)
  - Digital Khata (income/expense tracking)
  - Schemes Eligibility Matcher
  - Craft Passport (public product page + QR)
  - Vision Studio (image processing)
  - Voice & Listing (voice → listing pipeline)
  - Pricing & Market Linkage (cost-plus pricing)
"""
import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.routes import auth, khata, schemes, passport, vision_mock, voice_mock, pricing_mock
from core.config import settings
from db.init_db import init_db

# Initialize database tables on startup
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Unified API for the Artisan Workspace project — empowering Indian artisans",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- API Routers ---
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(khata.router, prefix="/api/khata", tags=["Digital Khata"])
app.include_router(schemes.router, prefix="/api/schemes", tags=["Schemes Eligibility"])
app.include_router(passport.router, prefix="/api/passport", tags=["Craft Passport"])
app.include_router(vision_mock.router, prefix="/api/vision", tags=["Vision & Image Studio"])
app.include_router(voice_mock.router, prefix="/api/voice", tags=["Voice & Listing"])
app.include_router(pricing_mock.router, prefix="/api/pricing", tags=["Pricing & Market"])


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Artisan Workspace API",
        "docs": "/docs",
        "version": "1.0.0",
        "workstreams": {
            "vision": "/api/vision/process",
            "voice": "/api/voice/listing",
            "pricing": "/api/pricing/calculate",
            "khata": "/api/khata/entry",
            "schemes": "/api/schemes/match?artisan_id=1",
            "passport": "/api/passport/1",
        },
    }
