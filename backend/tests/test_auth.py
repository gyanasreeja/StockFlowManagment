from tests.conftest import signup


def test_signup_creates_org_and_owner(client):
    res = client.post(
        "/api/auth/signup",
        json={"email": "A@Example.com", "password": "password123", "confirm_password": "password123", "organization_name": "Acme"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["access_token"]
    assert body["user"]["email"] == "a@example.com"
    assert body["user"]["role"] == "owner"
    assert body["user"]["organization"]["name"] == "Acme"
    assert body["user"]["organization"]["default_low_stock_threshold"] == 5


def test_signup_validation(client):
    base = {"email": "a@example.com", "password": "password123", "confirm_password": "password123", "organization_name": "Acme"}
    assert client.post("/api/auth/signup", json={**base, "email": "nope"}).status_code == 422
    assert client.post("/api/auth/signup", json={**base, "password": "short", "confirm_password": "short"}).status_code == 422
    assert client.post("/api/auth/signup", json={**base, "confirm_password": "different1"}).status_code == 422
    assert client.post("/api/auth/signup", json={**base, "organization_name": "   "}).status_code == 422


def test_duplicate_email_rejected(client):
    signup(client, "dup@example.com")
    res = client.post(
        "/api/auth/signup",
        json={"email": "dup@example.com", "password": "password123", "confirm_password": "password123", "organization_name": "Other"},
    )
    assert res.status_code == 409


def test_login_and_me(client):
    signup(client, "me@example.com", password="password123")
    bad = client.post("/api/auth/login", json={"email": "me@example.com", "password": "wrong-password"})
    assert bad.status_code == 401
    ok = client.post("/api/auth/login", json={"email": "me@example.com", "password": "password123"})
    assert ok.status_code == 200
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {ok.json()['access_token']}"})
    assert me.status_code == 200 and me.json()["email"] == "me@example.com"


def test_protected_routes_require_token(client):
    for path in ("/api/auth/me", "/api/products", "/api/dashboard", "/api/settings"):
        assert client.get(path).status_code == 401
    assert client.get("/api/products", headers={"Authorization": "Bearer garbage"}).status_code == 401

