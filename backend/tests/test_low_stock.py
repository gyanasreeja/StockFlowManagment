from app.services.stock import effective_threshold, is_low_stock
from tests.conftest import make_product, signup


def test_effective_threshold_helper():
    assert effective_threshold(None, 5) == 5
    assert effective_threshold(2, 5) == 2
    assert effective_threshold(0, 5) == 0  # 0 is a real value, not "unset"


def test_is_low_stock_boundaries():
    assert is_low_stock(5, None, 5) is True   # at threshold
    assert is_low_stock(6, None, 5) is False  # above threshold
    assert is_low_stock(3, 2, 5) is False     # product override wins
    assert is_low_stock(2, 2, 5) is True
    assert is_low_stock(0, 0, 5) is True


def test_dashboard_low_stock_with_org_and_product_thresholds(client):
    h = signup(client)
    make_product(client, h, name="At default", sku="A", quantity_on_hand=5)           # low (5 <= 5)
    make_product(client, h, name="Above default", sku="B", quantity_on_hand=6)        # ok
    make_product(client, h, name="Override low", sku="C", quantity_on_hand=20, low_stock_threshold=20)  # low
    make_product(client, h, name="Override ok", sku="D", quantity_on_hand=3, low_stock_threshold=1)     # ok

    dash = client.get("/api/dashboard", headers=h).json()
    assert dash["total_products"] == 4
    assert dash["total_quantity_on_hand"] == 34
    assert {i["sku"] for i in dash["low_stock_items"]} == {"A", "C"}
    thresholds = {i["sku"]: i["low_stock_threshold"] for i in dash["low_stock_items"]}
    assert thresholds == {"A": 5, "C": 20}

    # Raising the org default pulls the un-overridden product B into low stock.
    assert client.put("/api/settings", json={"default_low_stock_threshold": 6}, headers=h).status_code == 200
    dash = client.get("/api/dashboard", headers=h).json()
    assert {i["sku"] for i in dash["low_stock_items"]} == {"A", "B", "C"}

    flags = {p["sku"]: p["is_low_stock"] for p in client.get("/api/products", headers=h).json()}
    assert flags == {"A": True, "B": True, "C": True, "D": False}


def test_settings_validation(client):
    h = signup(client)
    assert client.put("/api/settings", json={"default_low_stock_threshold": -1}, headers=h).status_code == 422
    assert client.get("/api/settings", headers=h).json() == {"default_low_stock_threshold": 5}

