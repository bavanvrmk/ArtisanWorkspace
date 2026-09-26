from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db
from models.user import User
from core.security import create_access_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class LoginMock(BaseModel):
    username: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: int
    gender: str
    craft_type: str
    annual_income: float
    state: str


def _user_payload(user: User) -> dict:
    complete = all(
        [
            user.age is not None,
            bool(user.gender),
            bool(user.craft_type),
            user.annual_income is not None,
            bool(user.state),
        ]
    )
    return {
        "user_id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "age": user.age,
        "gender": user.gender,
        "craft_type": user.craft_type,
        "annual_income": user.annual_income,
        "state": user.state,
        "profile_complete": complete,
    }


@router.post("/login")
def login_mock(data: LoginMock, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        user = User(username=data.username, full_name=data.username, role="artisan")
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        **_user_payload(user),
    }


@router.get("/me")
def me(artisan_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == artisan_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_payload(user)


@router.put("/profile")
def update_profile(artisan_id: int, data: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == artisan_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.full_name:
        user.full_name = data.full_name
    user.age = data.age
    user.gender = data.gender.strip().lower()
    user.craft_type = data.craft_type.strip()
    user.annual_income = data.annual_income
    user.state = data.state.strip()
    db.commit()
    db.refresh(user)
    return _user_payload(user)
