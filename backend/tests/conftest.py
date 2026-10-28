import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)  # not used as a context manager, so the app's startup create_all is skipped
    app.dependency_overrides.clear()


def signup(client, email="owner@example.com", org="Acme", password="password123"):
    res = client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "confirm_password": password, "organization_name": org},
    )
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def make_product(client, headers, **overrides):
    body = {"name": "Widget", "sku": "W-1", "quantity_on_hand": 10, **overrides}
    res = client.post("/api/products", json=body, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()

