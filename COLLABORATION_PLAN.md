# Collaborative Project Plan & Workspace

Welcome to the shared workspace! This document serves as the central source of truth for all 5 workstreams. It defines the tasks, collaborative guidelines, and the **API Contracts** needed so that everyone can start working in parallel using mock data.

> [!NOTE]
> **Initial Phase - CLI First:** We will be starting with a Command Line Interface (CLI) for our initial development and integration. The development of the final UI will be done later.

---

## 🚀 Collaborative Guidelines

To ensure smooth parallel development, please follow these rules:

1. **Fork & Pull Request Workflow:** 
   - All team members should **fork** this repository and submit Pull Requests (PRs) from their forks to begin with.
2. **Branching Strategy:** 
   - `main`: Golden path, always deployable.
   - Branch naming: `feature/[workstream-number]-[brief-desc]` (e.g., `feature/1-mobile-home-screen`).
2. **API First:** 
   - Stick to the JSON shapes defined in the API Contracts below. If you need to change a contract, discuss it with the team before modifying this document.
   - Use mock data based on these contracts until the real endpoints are ready.
3. **Daily Sync:** 
   - Brief check-in to ensure no one is blocked by integration points.

---

## 🛠️ Workstreams & Task Breakdown

### 1. Mobile App & Offline Sync
**Lead:** [Assignee Name]
- [ ] Set up the project (e.g., React Native/Flutter).
- [ ] Build screens: Home, Scan, Khata, Schemes, Review & Publish.
- [ ] Implement icon-heavy navigation and Language Picker.
- [ ] Set up local database (SQLite/WatermelonDB) and sync queue.
- [ ] Integrate endpoints using mocked JSON data.

### 2. Vision & Image Studio
**Lead:** [Assignee Name]
- [x] Set up Python microservice for image processing.
- [x] Integrate background removal (`rembg`) and lighting correction (OpenCV).
- [x] Implement photo quality check (blur/dark detection).
- [x] Integrate CLIP or a Vision LLM for tagging craft type, material, and category.
- [x] Expose `POST /api/vision/process` endpoint.

### 3. Voice & Listing Generation
**Lead:** [Assignee Name]
- [ ] Integrate Speech-to-Text & Translation (Bhashini with Whisper fallback).
- [ ] Write LLM prompt to map transcripts + image tags into a structured listing.
- [ ] Implement Text-to-Speech (TTS) for listings and alerts.
- [ ] Collect and test with 10-15 real voice samples across 2-3 languages.
- [ ] Expose `POST /api/voice/listing` endpoint.

### 4. Pricing & Market Linkage
**Lead:** [Assignee Name]
- [x] Build cost-plus formula logic (Retail & B2B splits).
- [x] Compile comparable-price dataset for 4-5 crafts.
- [x] Generate "Why this price" explanation text.
- [x] Export catalog in ONDC-style schema or CSV.
- [x] Build a mock buyer view for validation.
- [ ] Expose `POST /api/pricing/calculate` endpoint.

### 5. Backend, Khata, Schemes & Passport
**Lead:** [Assignee Name]
- [ ] Set up FastAPI, Postgres, and Auth (Artisan/Admin/Buyer roles).
- [ ] Set up image storage (e.g., S3 or local bucket).
- [ ] Build Digital Khata endpoints (Income, Expense, Voice entry parsing, Summary).
- [ ] Build Schemes matcher (JSON rules -> Eligibility) + Audio Alerts.
- [ ] Generate Craft Passport (QR code + public product page).
- [ ] Handle deployment and prepare the demo script.

---

## 📄 API Contracts (Agreed JSON Shapes)

By agreeing on these shapes today (Day 1), the frontend can use mock data while the backend builds the logic.

### A. Image Studio API (`POST /api/vision/process`)
**Request (FormData):**
- `image`: [File]

**Response:**
```json
{
  "status": "success",
  "processed_image_url": "https://storage.../cleaned-image.png",
  "quality_passed": true,
  "quality_feedback": null,
  "tags": {
    "craft_type": "Pottery",
    "material": "Terracotta",
    "category": "Home Decor"
  }
}
```

### B. Voice & Listing API (`POST /api/voice/listing`)
**Request:**
- `audio_url`: string (or file upload)
- `image_tags`: object (from Vision API)
- `language`: string (e.g., "hi")

**Response:**
```json
{
  "transcript": "यह एक सुंदर मिट्टी का बर्तन है...",
  "translated_text": "This is a beautiful clay pot...",
  "listing": {
    "title": "Handcrafted Terracotta Clay Pot",
    "description": "Authentic handcrafted terracotta pot perfect for home decor.",
    "seo_tags": ["terracotta", "pottery", "handmade", "decor"]
  },
  "audio_alert_url": "https://storage.../tts-alert.mp3"
}
```

### C. Pricing API (`POST /api/pricing/calculate`)
**Request:**
- `material_cost`: number
- `labour_hours`: number
- `hourly_wage`: number
- `craft_type`: string

**Response:**
```json
{
  "retail_price": 1250.00,
  "b2b_price": 950.00,
  "market_range": [1000, 1500],
  "explanation": "Based on 5 hours of labour at ₹100/hr, ₹200 materials, and standard 30% margin. Similar terracotta items retail between ₹1000 and ₹1500."
}
```

### D. Digital Khata API (`POST /api/khata/entry`)
**Request:**
- `artisan_id`: string
- `type`: "income" | "expense"
- `amount`: number
- `category`: string
- `notes`: string (optional)

**Response:**
```json
{
  "entry_id": "txn_8923",
  "status": "recorded",
  "current_balance": 15400.00,
  "summary": "Income recorded. Total income this month: ₹25,000."
}
```

### E. Schemes Eligibility API (`GET /api/schemes/match`)
**Request:**
- `artisan_id`: string (used to look up profile: age, craft type, income)

**Response:**
```json
{
  "eligible_schemes": [
    {
      "scheme_id": "sch_01",
      "name": "PM Vishwakarma Yojana",
      "benefit": "Subsidized loan up to ₹1 Lakh",
      "audio_summary_url": "https://storage.../scheme-audio.mp3"
    }
  ]
}
```


---

## 🛠️ Workstream Tools & CLIs

### Workstream 2: Vision & Image Studio (`vision_studio/`)
```bash
# Process an image, perform quality check, remove background, and auto-tag
python vision_studio/cli.py process test_image.jpg --output cleaned.png

# Start the FastAPI server locally
python vision_studio/cli.py serve --port 8000
```

### Workstream 3: Voice & Listing Generation (`voice_listing/`)
```bash
python voice_listing/cli.py listing --mock
python voice_listing/cli.py transcribe audio.wav --lang hi
python voice_listing/cli.py tts "नमस्ते" --lang hi -o hello.wav
```

### Workstream 4: Pricing & Market Linkage (`pricing_market/`)
```bash
# Calculate cost-plus retail & B2B prices (matching Contract C)
python pricing_market/cli.py calculate --mock
python pricing_market/cli.py calculate --craft-id terracotta-pot

# View 'Why This Price' breakdown narrative
python pricing_market/cli.py explain --craft-id blue-pottery-vase

# Inspect 5-craft dataset & comparable benchmarks
python pricing_market/cli.py dataset

# Export catalog to ONDC Beckn schema (JSON) or CSV
python pricing_market/cli.py export-ondc --output ondc_catalog.json
python pricing_market/cli.py export-ondc --format csv --output ondc_catalog.csv

# Launch interactive Mock Buyer View in browser
python pricing_market/cli.py buyer-view --port 8080
```

---

*This document is a living artifact. Please submit a PR to update contracts or check off tasks as they are completed.*

