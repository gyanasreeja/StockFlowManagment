from tests.conftest import make_product, signup


def test_crud_and_search(client):
    h = signup(client)
    p = make_product(client, h, name="Blue Widget", sku="BLU-1", selling_price=9.99, cost_price=4.5)
    assert p["selling_price"] == 9.99 and p["is_low_stock"] is False
    make_product(client, h, name="Red Gadget", sku="RED-2")

    assert len(client.get("/api/products", headers=h).json()) == 2
    assert [x["sku"] for x in client.get("/api/products?search=blue", headers=h).json()] == ["BLU-1"]
    assert [x["sku"] for x in client.get("/api/products?search=red-2", headers=h).json()] == ["RED-2"]

    upd = client.put(f"/api/products/{p['id']}", json={"name": "Navy Widget", "quantity_on_hand": 3}, headers=h)
    assert upd.status_code == 200 and upd.json()["name"] == "Navy Widget" and upd.json()["is_low_stock"] is True

    assert client.delete(f"/api/products/{p['id']}", headers=h).status_code == 204
    assert client.get(f"/api/products/{p['id']}", headers=h).status_code == 404


def test_duplicate_sku_conflict(client):
    h = signup(client)
    make_product(client, h, sku="DUP")
    assert client.post("/api/products", json={"name": "Again", "sku": "DUP"}, headers=h).status_code == 409
    other = make_product(client, h, sku="OTHER")
    assert client.put(f"/api/products/{other['id']}", json={"sku": "DUP"}, headers=h).status_code == 409


def test_adjust_stock(client):
    h = signup(client)
    p = make_product(client, h, quantity_on_hand=5)
    url = f"/api/products/{p['id']}/adjust-stock"
    assert client.patch(url, json={"delta": 3, "note": "restock"}, headers=h).json()["quantity_on_hand"] == 8
    assert client.patch(url, json={"delta": -8}, headers=h).json()["quantity_on_hand"] == 0
    assert client.patch(url, json={"delta": -1}, headers=h).status_code == 400
    assert client.patch(url, json={"delta": 0}, headers=h).status_code == 422
    assert client.get(f"/api/products/{p['id']}", headers=h).json()["quantity_on_hand"] == 0


def test_validation(client):
    h = signup(client)
    assert client.post("/api/products", json={"name": "", "sku": "S"}, headers=h).status_code == 422
    assert client.post("/api/products", json={"name": "N", "sku": "S", "quantity_on_hand": -1}, headers=h).status_code == 422
    assert client.post("/api/products", json={"name": "N", "sku": "S", "cost_price": -2}, headers=h).status_code == 422

