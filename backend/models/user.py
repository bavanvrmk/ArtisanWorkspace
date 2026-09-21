from sqlalchemy import Column, Integer, String, Float
from db.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="artisan")  # artisan, admin, buyer
    # Fields for schemes eligibility matching
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)  # male, female, other
    craft_type = Column(String, nullable=True)
    annual_income = Column(Float, nullable=True)
    state = Column(String, nullable=True)
