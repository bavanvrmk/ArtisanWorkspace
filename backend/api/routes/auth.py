from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db
from models.user import User
from core.security import create_access_token
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    age: int
    gender: str
    craft_type: str
    state: str
    annual_income: float

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=data.username,
        full_name=data.full_name,
        hashed_password=data.password, # Plaintext for demo purposes
        role="artisan",
        age=data.age,
        gender=data.gender,
        craft_type=data.craft_type,
        state=data.state,
        annual_income=data.annual_income
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(subject=new_user.id)
    return {"access_token": access_token, "token_type": "bearer", "user_id": new_user.id, "full_name": new_user.full_name}

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or user.hashed_password != data.password:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "full_name": user.full_name}
