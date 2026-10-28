"""Optional demo data:  python seed.py   ->  login demo@example.com / password123"""
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Organization, Product, User

Base.metadata.create_all(bind=engine)
db = SessionLocal()
if db.query(User).filter_by(email="demo@example.com").first():
    print("Demo data already exists.")
else:
    org = Organization(name="Demo Hardware Co.", default_low_stock_threshold=5)
    db.add(org)
    db.flush()
    user = User(email="demo@example.com", hashed_password=hash_password("password123"), role="owner", organization_id=org.id)
    db.add(user)
    db.flush()
    rows = [
        ("Claw Hammer", "HAM-001", 42, 8.5, 14.99, None),
        ("Phillips Screwdriver", "SCR-010", 4, 2.1, 5.49, None),
        ("Cordless Drill", "DRL-200", 3, 55.0, 89.0, 2),
        ("Safety Goggles", "SAF-030", 0, 1.8, 6.0, 10),
        ("Tape Measure 5m", "TAP-005", 120, 2.5, 7.25, None),
    ]
    for name, sku, qty, cost, price, thr in rows:
        db.add(Product(organization_id=org.id, name=name, sku=sku, quantity_on_hand=qty, cost_price=cost,
                       selling_price=price, low_stock_threshold=thr, last_updated_by=user.id))
    db.commit()
    print("Seeded. Login: demo@example.com / password123")
db.close()

