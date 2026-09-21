"""
Digital Khata API Route — Real Balance Tracking
================================================
Implements income/expense recording with real balance computation,
monthly summary, and entry listing. Matches Contract D.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from api.deps import get_db
from models.khata import KhataEntry
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class KhataEntryCreate(BaseModel):
    artisan_id: str
    type: str  # "income" or "expense"
    amount: float
    category: str
    notes: Optional[str] = None


@router.post("/entry")
def create_entry(entry: KhataEntryCreate, db: Session = Depends(get_db)):
    """
    Record a new income or expense entry.
    Matches API Contract D from COLLABORATION_PLAN.md.
    """
    new_entry = KhataEntry(
        artisan_id=int(entry.artisan_id),
        type=entry.type,
        amount=entry.amount,
        category=entry.category,
        notes=entry.notes,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    # Calculate real balance for this artisan
    income_total = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == int(entry.artisan_id))
        .filter(KhataEntry.type == "income")
        .scalar()
    )
    expense_total = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == int(entry.artisan_id))
        .filter(KhataEntry.type == "expense")
        .scalar()
    )
    current_balance = float(income_total) - float(expense_total)

    # Monthly totals for this type
    now = datetime.utcnow()
    month_total = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == int(entry.artisan_id))
        .filter(KhataEntry.type == entry.type)
        .filter(extract("month", KhataEntry.created_at) == now.month)
        .filter(extract("year", KhataEntry.created_at) == now.year)
        .scalar()
    )

    return {
        "entry_id": f"txn_{new_entry.id}",
        "status": "recorded",
        "current_balance": round(current_balance, 2),
        "summary": f"{entry.type.capitalize()} of ₹{entry.amount:,.2f} recorded. "
                   f"Total {entry.type} this month: ₹{float(month_total):,.2f}. "
                   f"Current balance: ₹{current_balance:,.2f}.",
    }


@router.get("/summary")
def get_summary(artisan_id: str = Query(...), db: Session = Depends(get_db)):
    """Get monthly income/expense summary for an artisan."""
    aid = int(artisan_id)
    now = datetime.utcnow()

    income_total = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == aid, KhataEntry.type == "income")
        .scalar()
    )
    expense_total = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == aid, KhataEntry.type == "expense")
        .scalar()
    )

    month_income = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == aid, KhataEntry.type == "income")
        .filter(extract("month", KhataEntry.created_at) == now.month)
        .filter(extract("year", KhataEntry.created_at) == now.year)
        .scalar()
    )
    month_expense = (
        db.query(func.coalesce(func.sum(KhataEntry.amount), 0))
        .filter(KhataEntry.artisan_id == aid, KhataEntry.type == "expense")
        .filter(extract("month", KhataEntry.created_at) == now.month)
        .filter(extract("year", KhataEntry.created_at) == now.year)
        .scalar()
    )

    entry_count = (
        db.query(func.count(KhataEntry.id))
        .filter(KhataEntry.artisan_id == aid)
        .scalar()
    )

    return {
        "artisan_id": artisan_id,
        "total_income": round(float(income_total), 2),
        "total_expense": round(float(expense_total), 2),
        "current_balance": round(float(income_total) - float(expense_total), 2),
        "month_income": round(float(month_income), 2),
        "month_expense": round(float(month_expense), 2),
        "month_net": round(float(month_income) - float(month_expense), 2),
        "total_entries": entry_count,
    }


@router.get("/entries")
def list_entries(
    artisan_id: str = Query(...),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List all khata entries for an artisan, most recent first."""
    entries = (
        db.query(KhataEntry)
        .filter(KhataEntry.artisan_id == int(artisan_id))
        .order_by(KhataEntry.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "artisan_id": artisan_id,
        "entries": [
            {
                "entry_id": f"txn_{e.id}",
                "type": e.type,
                "amount": e.amount,
                "category": e.category,
                "notes": e.notes,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in entries
        ],
    }
