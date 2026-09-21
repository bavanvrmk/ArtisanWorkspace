"""
Pricing API Route — Real Engine Integration
============================================
Replaces hardcoded mock with actual cost-plus pricing calculation
using the pricing_market engine. Matches Contract C.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import importlib.util
from pathlib import Path

router = APIRouter()

# Import pricing_market modules using importlib to avoid name collisions
_pm_dir = Path(__file__).resolve().parents[3] / "pricing_market"


def _import_from_pm(module_name: str):
    spec = importlib.util.spec_from_file_location(
        f"pricing_market.{module_name}", _pm_dir / f"{module_name}.py"
    )
    mod = importlib.util.module_from_spec(spec)
    # Temporarily make pricing_market importable for internal relative imports
    import sys
    old = sys.path.copy()
    sys.path.insert(0, str(_pm_dir))
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.path = old
    return mod


_pricing_engine = _import_from_pm("pricing_engine")
_mock_data = _import_from_pm("mock_data")

calculate_pricing = _pricing_engine.calculate_pricing
CRAFTS_DATASET = _mock_data.CRAFTS_DATASET


class PricingRequest(BaseModel):
    material_cost: float
    labour_hours: float
    hourly_wage: float
    craft_type: str = "Handicraft"
    craft_id: Optional[str] = None
    retail_margin: Optional[float] = 0.28
    b2b_margin: Optional[float] = 0.14


@router.post("/calculate")
def calculate_pricing_endpoint(req: PricingRequest):
    """
    Calculate retail & B2B prices with cost-plus formula.
    Matches API Contract C from COLLABORATION_PLAN.md.
    """
    material = req.material_cost
    hours = req.labour_hours
    wage = req.hourly_wage
    craft = req.craft_type
    retail_margin = req.retail_margin
    b2b_margin = req.b2b_margin

    # If a craft_id is provided, use dataset values
    if req.craft_id and req.craft_id in CRAFTS_DATASET:
        c = CRAFTS_DATASET[req.craft_id]
        pf = c["pricing_factors"]
        material = pf["material_cost"]
        hours = pf["labour_hours"]
        wage = pf["hourly_wage"]
        craft = c["craft_type"]
        retail_margin = pf.get("retail_margin", retail_margin)
        b2b_margin = pf.get("b2b_margin", b2b_margin)

    result = calculate_pricing(
        material_cost=material,
        labour_hours=hours,
        hourly_wage=wage,
        craft_type=craft,
        retail_margin=retail_margin,
        b2b_margin=b2b_margin,
    )

    return result
