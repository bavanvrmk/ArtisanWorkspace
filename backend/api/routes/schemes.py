"""
Schemes Eligibility API Route — Real Matching
==============================================
Matches artisan profile against government scheme eligibility rules.
Matches Contract E.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from api.deps import get_db
from models.user import User
from schemes_data import match_schemes

router = APIRouter()


@router.get("/match")
def match_schemes_endpoint(
    artisan_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Match an artisan against eligible government schemes.
    Matches API Contract E from COLLABORATION_PLAN.md.
    """
    # Look up artisan profile
    user = db.query(User).filter(User.id == int(artisan_id)).first()
    if not user:
        return {
            "artisan_id": artisan_id,
            "needs_profile": True,
            "eligible_count": 0,
            "eligible_schemes": [],
            "message": "Tell us your age, gender, craft, yearly income, and state first.",
        }

    complete = all(
        [
            user.age is not None,
            bool(user.gender),
            bool(user.craft_type),
            user.annual_income is not None,
            bool(user.state),
        ]
    )
    if not complete:
        return {
            "artisan_id": artisan_id,
            "needs_profile": True,
            "eligible_count": 0,
            "eligible_schemes": [],
            "message": "Tell us your age, gender, craft, yearly income, and state first.",
        }

    eligible = match_schemes(
        craft_type=user.craft_type,
        age=user.age,
        annual_income=user.annual_income,
        gender=user.gender,
        state=user.state,
    )
    return {
        "artisan_id": artisan_id,
        "needs_profile": False,
        "eligible_count": len(eligible),
        "eligible_schemes": eligible,
    }


@router.get("/all")
def list_all_schemes():
    """List all available government schemes in the database."""
    from schemes_data import SCHEMES
    return {
        "total_schemes": len(SCHEMES),
        "schemes": [
            {
                "scheme_id": s["scheme_id"],
                "name": s["name"],
                "ministry": s["ministry"],
                "benefit": s["benefit"],
                "link": s["link"],
            }
            for s in SCHEMES
        ],
    }
