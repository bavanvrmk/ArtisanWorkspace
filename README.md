# 🏺 Artisan Workspace

**Empowering Indian Artisans through Technology** — A unified platform that helps rural craftworkers create professional marketplace listings using voice input, get fair AI-powered pricing, track finances, and discover government schemes.

> Built for Smart India Hackathon (SIH) 2025 — CLI-First Architecture

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/bavanvrmk/ArtisanWorkspace.git
cd ArtisanWorkspace

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize database with demo data
cd backend
python -m db.init_db

# 5. Start the API server
uvicorn main:app --reload --port 8000
# Visit http://localhost:8000/docs for Swagger UI
```

---

## 📐 Architecture Overview

```
ArtisanWorkspace/
├── backend/            # Workstream 5: FastAPI server, Auth, DB, Khata, Schemes, Passport
│   ├── api/routes/     # All API route handlers
│   ├── core/           # Config & security
│   ├── db/             # SQLAlchemy session, models, DB init & seeding
│   ├── models/         # User, KhataEntry, Product ORM models
│   └── schemes_data.py # Government schemes eligibility rules
├── vision_studio/      # Workstream 2: Image processing, bg removal, CLIP tagging
├── voice_listing/      # Workstream 3: Bhashini STT/TTS, listing generation
├── pricing_market/     # Workstream 4: Cost-plus pricing, ONDC export, buyer view
├── pricing/            # Early pricing prototype (superseded by pricing_market/)
└── COLLABORATION_PLAN.md
```

---

## 🛠️ Workstreams

### Workstream 2: Vision & Image Studio

Processes artisan product photos — quality check, lighting correction, background removal, and auto-tagging using CLIP.

```bash
cd vision_studio

# Process an image
python cli.py process test_image.jpg --output cleaned.png

# Start the API server
python cli.py serve --port 8000
```

**API:** `POST /api/vision/process` (file upload)

---

### Workstream 3: Voice & Listing Generation

Converts artisan voice descriptions (in Hindi, Tamil, Telugu, etc.) into marketplace-ready product listings using Bhashini API + Gemini LLM.

```bash
cd voice_listing

# Run with mock data (no API keys needed)
python cli.py listing --mock

# Transcribe real audio
python cli.py transcribe audio.wav --lang hi

# Translate text
python cli.py translate "नमस्ते" --from hi --to en

# Text-to-speech
python cli.py tts "Hello world" --lang en --output hello.wav

# Full pipeline with real audio
python cli.py listing audio.wav --lang hi --tags '{"craft_type":"Pottery","material":"Terracotta","category":"Home Decor"}'
```

**Setup:** Copy `.env.example` to `.env` and fill in your Bhashini API credentials.

**API:** `POST /api/voice/listing` | `POST /api/voice/listing/upload` (file upload)

---

### Workstream 4: Pricing & Market Linkage

Cost-plus pricing engine with transparent "Why this price?" explanations, ONDC catalog export, and a mock buyer web view.

```bash
cd pricing_market

# Calculate price (mock inputs matching Contract C)
python cli.py calculate --mock

# Calculate for a specific craft
python cli.py calculate --craft-id terracotta-pot

# View "Why This Price?" narrative
python cli.py explain --craft-id blue-pottery-vase

# List all 5 craft datasets
python cli.py dataset

# Export ONDC catalog
python cli.py export-ondc --output ondc_catalog.json
python cli.py export-ondc --format csv --output catalog.csv

# Launch buyer view in browser
python cli.py buyer-view --port 8080
```

**API:** `POST /api/pricing/calculate`

---

### Workstream 5: Backend, Khata, Schemes & Passport

Unified FastAPI backend with SQLite database, authentication, financial tracking, scheme matching, and craft passport generation.

```bash
cd backend

# Initialize & seed database
python -m db.init_db

# Start server
uvicorn main:app --reload --port 8000
```

#### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Mock login (creates user if needed) |
| `/api/khata/entry` | POST | Record income/expense |
| `/api/khata/summary?artisan_id=1` | GET | Monthly financial summary |
| `/api/khata/entries?artisan_id=1` | GET | List all entries |
| `/api/schemes/match?artisan_id=1` | GET | Find eligible government schemes |
| `/api/schemes/all` | GET | List all available schemes |
| `/api/passport/{id}` | GET | Craft Passport public page |
| `/api/passport/{id}/qr` | GET | QR code for a product |
| `/api/vision/process` | POST | Image processing pipeline |
| `/api/voice/listing` | POST | Voice listing (JSON) |
| `/api/voice/listing/upload` | POST | Voice listing (file upload) |
| `/api/pricing/calculate` | POST | Cost-plus pricing calculation |

---

## 📄 API Contracts

All endpoints follow the agreed JSON shapes defined in [COLLABORATION_PLAN.md](./COLLABORATION_PLAN.md). Key contracts:

- **Contract A** — Vision: `POST /api/vision/process`
- **Contract B** — Voice: `POST /api/voice/listing`
- **Contract C** — Pricing: `POST /api/pricing/calculate`
- **Contract D** — Khata: `POST /api/khata/entry`
- **Contract E** — Schemes: `GET /api/schemes/match`

---

## 🗄️ Database

SQLite database (`backend/artisan.db`) with three tables:

| Table | Description |
|---|---|
| `users` | Artisan/Admin/Buyer profiles with demographics |
| `products` | Product listings with pricing |
| `khata_entries` | Income/expense transaction ledger |

Demo data is auto-seeded when running `python -m db.init_db`.

---

## 🏛️ Government Schemes

The platform matches artisans against **7 real government schemes**:

1. **PM Vishwakarma Yojana** — Subsidized loans + skill training
2. **MUDRA Loan (Shishu)** — Collateral-free micro loans
3. **Stand-Up India** — Loans for women entrepreneurs
4. **National Handicraft Development** — Design workshops + marketing
5. **Handloom Weavers' MUDRA** — Concessional loans for weavers
6. **PM Jan Dhan Yojana** — Zero-balance accounts + overdraft
7. **One District One Product** — Marketing & export support

---

## 🔧 Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `BHASHINI_USER_ID` | Voice Listing | Bhashini/ULCA user ID |
| `BHASHINI_API_KEY` | Voice Listing | Bhashini/ULCA API key |
| `BHASHINI_PIPELINE_ID` | Voice Listing | Pipeline ID (default provided) |
| `GEMINI_API_KEY` | Voice Listing | Google Gemini key (optional, for LLM listings) |

---

## 👥 Team

Built collaboratively with 5 parallel workstreams. See [COLLABORATION_PLAN.md](./COLLABORATION_PLAN.md) for the full breakdown.

---

## 📜 License

This project was created for Smart India Hackathon (SIH) 2025.
