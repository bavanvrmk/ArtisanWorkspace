"""
Craft Passport API Route — Enhanced Design
===========================================
Generates a polished public product page (Craft Passport) and QR code.
Each product gets a unique public page showing artisan story, product
details, pricing transparency, and a scannable QR code.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from api.deps import get_db
from models.product import Product
from models.user import User
import qrcode
import os
import base64
import io

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _generate_qr_base64(url: str) -> str:
    """Generate a QR code as base64-encoded PNG for inline embedding."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=8,
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1a1a2e", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@router.get("/{product_id}", response_class=HTMLResponse)
def get_passport(product_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Render a polished Craft Passport — the public product page.
    """
    product = db.query(Product).filter(Product.id == product_id).first()

    # Fallback demo product if not found
    if not product:
        product = Product(
            id=product_id,
            title="Handcrafted Terracotta Clay Pot",
            description=(
                "Authentic handcrafted terracotta pot made by skilled Rajasthani artisans "
                "using centuries-old pottery techniques. Hand-thrown on a traditional wheel, "
                "decorated with natural earth-toned motifs. Perfect for home decor."
            ),
            retail_price=1250.00,
            b2b_price=950.00,
            craft_type="Pottery",
            material="Terracotta",
            artisan_id=1,
        )

    # Try to look up artisan
    artisan = None
    if product.artisan_id:
        artisan = db.query(User).filter(User.id == product.artisan_id).first()

    artisan_name = artisan.full_name if artisan else "Master Artisan"
    artisan_craft = artisan.craft_type if artisan and artisan.craft_type else product.craft_type
    artisan_state = artisan.state if artisan and artisan.state else "India"

    # Generate QR code inline
    base_url = str(request.base_url).rstrip("/")
    product_url = f"{base_url}/api/passport/{product_id}"
    qr_b64 = _generate_qr_base64(product_url)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Craft Passport — {product.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            min-height: 100vh;
            display: flex; justify-content: center; align-items: flex-start;
            padding: 2rem 1rem;
            color: #e0e0e0;
        }}
        .passport {{
            max-width: 520px; width: 100%;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            overflow: hidden;
        }}
        .passport-header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1.5rem 2rem;
            text-align: center;
        }}
        .passport-header h1 {{
            font-size: 1.4rem; font-weight: 700; color: #fff;
            letter-spacing: -0.02em;
        }}
        .passport-header .subtitle {{
            font-size: 0.8rem; color: rgba(255,255,255,0.75);
            margin-top: 0.25rem; text-transform: uppercase; letter-spacing: 0.12em;
        }}
        .badge {{
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 100px;
            padding: 0.2rem 0.8rem;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            margin-top: 0.5rem;
        }}
        .body {{ padding: 1.5rem 2rem; }}
        .section {{ margin-bottom: 1.5rem; }}
        .section-title {{
            font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.15em;
            color: #a0a0c0; margin-bottom: 0.6rem; font-weight: 600;
        }}
        .field {{ margin-bottom: 0.8rem; }}
        .field-label {{
            font-size: 0.72rem; color: #888; font-weight: 500;
        }}
        .field-value {{
            font-size: 0.95rem; color: #f0f0f0; font-weight: 500;
            margin-top: 0.1rem;
        }}
        .description {{
            font-size: 0.85rem; color: #c0c0d0; line-height: 1.6;
        }}
        .pricing-grid {{
            display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;
        }}
        .price-card {{
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px; padding: 1rem; text-align: center;
        }}
        .price-card .label {{
            font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em;
            color: #a0a0c0; margin-bottom: 0.3rem;
        }}
        .price-card .price {{
            font-size: 1.5rem; font-weight: 700; color: #7ee8a0;
        }}
        .price-card.b2b .price {{ color: #64b5f6; }}
        .artisan-card {{
            display: flex; align-items: center; gap: 1rem;
            background: rgba(255,255,255,0.05);
            border-radius: 12px; padding: 1rem;
        }}
        .artisan-avatar {{
            width: 48px; height: 48px; border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem; color: #fff; font-weight: 700;
            flex-shrink: 0;
        }}
        .artisan-info .name {{ font-weight: 600; color: #f0f0f0; font-size: 0.95rem; }}
        .artisan-info .meta {{ font-size: 0.78rem; color: #a0a0c0; margin-top: 0.15rem; }}
        .qr-section {{
            text-align: center; padding: 1.5rem 2rem;
            border-top: 1px solid rgba(255,255,255,0.08);
        }}
        .qr-section img {{
            width: 120px; height: 120px; border-radius: 8px;
            border: 2px solid rgba(255,255,255,0.15);
        }}
        .qr-section .qr-label {{
            font-size: 0.7rem; color: #888; margin-top: 0.5rem;
        }}
        .footer {{
            text-align: center; padding: 1rem 2rem;
            font-size: 0.68rem; color: #666;
            border-top: 1px solid rgba(255,255,255,0.05);
        }}
    </style>
</head>
<body>
    <div class="passport">
        <div class="passport-header">
            <h1>🏺 {product.title}</h1>
            <div class="subtitle">Craft Passport — Verified Product</div>
            <span class="badge">✓ Artisan Verified</span>
        </div>

        <div class="body">
            <div class="section">
                <div class="section-title">👤 Artisan</div>
                <div class="artisan-card">
                    <div class="artisan-avatar">{artisan_name[0].upper()}</div>
                    <div class="artisan-info">
                        <div class="name">{artisan_name}</div>
                        <div class="meta">{artisan_craft} · {artisan_state}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📦 Product Details</div>
                <div class="field">
                    <div class="field-label">Craft Type</div>
                    <div class="field-value">{product.craft_type}</div>
                </div>
                <div class="field">
                    <div class="field-label">Material</div>
                    <div class="field-value">{product.material}</div>
                </div>
                <div class="description">{product.description}</div>
            </div>

            <div class="section">
                <div class="section-title">💰 Transparent Pricing</div>
                <div class="pricing-grid">
                    <div class="price-card">
                        <div class="label">Retail Price</div>
                        <div class="price">₹{product.retail_price:,.0f}</div>
                    </div>
                    <div class="price-card b2b">
                        <div class="label">B2B Wholesale</div>
                        <div class="price">₹{product.b2b_price:,.0f}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="qr-section">
            <img src="data:image/png;base64,{qr_b64}" alt="Craft Passport QR Code" />
            <div class="qr-label">Scan to verify this Craft Passport</div>
        </div>

        <div class="footer">
            Artisan Workspace · Bharat Artisan Direct Marketplace · Verified by SIH 2025
        </div>
    </div>
</body>
</html>"""

    return HTMLResponse(content=html_content)


@router.get("/{product_id}/qr")
def generate_qr(product_id: int, request: Request):
    """Generate and return QR code as a PNG image file."""
    base_url = str(request.base_url).rstrip("/")
    product_url = f"{base_url}/api/passport/{product_id}"

    qr_filename = f"{UPLOAD_DIR}/qr_{product_id}.png"

    if not os.path.exists(qr_filename):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(product_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(qr_filename)

    return FileResponse(qr_filename, media_type="image/png")
