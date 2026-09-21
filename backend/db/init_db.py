"""
Database Initialization & Seeding
=================================
Creates all tables and seeds demo data for out-of-the-box demo readiness.
"""
from db.session import engine
from db.base import Base
from models import user, khata, product


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def seed_demo_data():
    """
    Seed a demo artisan user, a demo product, and some khata entries
    so the API works immediately without manual setup.
    """
    from db.session import SessionLocal
    from models.user import User
    from models.product import Product
    from models.khata import KhataEntry

    db = SessionLocal()
    try:
        # Check if demo user already exists
        existing = db.query(User).filter(User.username == "demo_artisan").first()
        if existing:
            print("[init_db] Demo data already seeded. Skipping.")
            return

        # 1. Create demo artisan
        demo_user = User(
            username="demo_artisan",
            full_name="Rameshwar Prajapat",
            role="artisan",
            age=42,
            gender="male",
            craft_type="Pottery",
            annual_income=180000.0,
            state="Rajasthan",
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        print(f"[init_db] Created demo artisan: {demo_user.full_name} (id={demo_user.id})")

        # 2. Create demo product
        demo_product = Product(
            artisan_id=demo_user.id,
            title="Handcrafted Terracotta Clay Pot",
            description=(
                "Authentic handcrafted terracotta pot made by skilled Rajasthani artisans "
                "using centuries-old pottery techniques. Hand-thrown on a traditional wheel, "
                "sun-baked and wood-fired in an earthen pit kiln. Features micro-porous walls "
                "for natural evaporative cooling."
            ),
            retail_price=1250.00,
            b2b_price=950.00,
            craft_type="Pottery",
            material="Terracotta",
        )
        db.add(demo_product)
        db.commit()
        db.refresh(demo_product)
        print(f"[init_db] Created demo product: {demo_product.title} (id={demo_product.id})")

        # 3. Create some demo khata entries
        entries = [
            KhataEntry(artisan_id=demo_user.id, type="income", amount=5000.00, category="Sales", notes="Sold 4 clay pots at weekly market"),
            KhataEntry(artisan_id=demo_user.id, type="expense", amount=1200.00, category="Raw Materials", notes="Purchased 50kg clay from supplier"),
            KhataEntry(artisan_id=demo_user.id, type="income", amount=8500.00, category="B2B Order", notes="Bulk order of 10 pots for Jaipur boutique"),
            KhataEntry(artisan_id=demo_user.id, type="expense", amount=600.00, category="Fuel", notes="Wood and bio-fuel for kiln firing"),
            KhataEntry(artisan_id=demo_user.id, type="income", amount=3000.00, category="Sales", notes="Sold decorated vase at craft fair"),
        ]
        db.add_all(entries)
        db.commit()
        print(f"[init_db] Created {len(entries)} demo khata entries.")

        # 4. Create a demo buyer user
        demo_buyer = User(
            username="demo_buyer",
            full_name="Priya Sharma",
            role="buyer",
            age=30,
            gender="female",
            state="Delhi",
        )
        db.add(demo_buyer)
        db.commit()
        print(f"[init_db] Created demo buyer: {demo_buyer.full_name}")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()
    print("[init_db] Database initialized and seeded successfully.")
