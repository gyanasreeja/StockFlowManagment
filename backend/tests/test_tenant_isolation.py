from tests.conftest import make_product, signup


def test_orgs_cannot_see_or_modify_each_other(client):
    a = signup(client, "a@example.com", "Org A")
    b = signup(client, "b@example.com", "Org B")
    product = make_product(client, a, name="Secret", sku="SEC-1", quantity_on_hand=7)
    pid = product["id"]

    # B cannot read, update, delete or adjust A's product: always 404.
    assert client.get(f"/api/products/{pid}", headers=b).status_code == 404
    assert client.put(f"/api/products/{pid}", json={"name": "Hacked"}, headers=b).status_code == 404
    assert client.patch(f"/api/products/{pid}/adjust-stock", json={"delta": 1}, headers=b).status_code == 404
    assert client.delete(f"/api/products/{pid}", headers=b).status_code == 404

    # B's list, search and dashboard are empty.
    assert client.get("/api/products", headers=b).json() == []
    assert client.get("/api/products?search=Secret", headers=b).json() == []
    dash_b = client.get("/api/dashboard", headers=b).json()
    assert dash_b["total_products"] == 0 and dash_b["total_quantity_on_hand"] == 0

    # A's product is untouched.
    after = client.get(f"/api/products/{pid}", headers=a).json()
    assert after["name"] == "Secret" and after["quantity_on_hand"] == 7

    # SKU uniqueness is per organization: B can reuse the same SKU.
    assert client.post("/api/products", json={"name": "Mine", "sku": "SEC-1"}, headers=b).status_code == 201

    # Settings are per organization, and a client-sent organization_id is ignored.
    client.put("/api/settings", json={"default_low_stock_threshold": 50}, headers=b)
    assert client.get("/api/settings", headers=a).json()["default_low_stock_threshold"] == 5
    sneaky = client.post("/api/products", json={"name": "X", "sku": "X-1", "organization_id": 1}, headers=b)
    assert sneaky.status_code == 201
    assert client.get(f"/api/products/{sneaky.json()['id']}", headers=a).status_code == 404

