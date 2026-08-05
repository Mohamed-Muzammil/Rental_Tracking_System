def test_register_equipment_resolves_catalog(client):
    res = client.post(
        "/api/equipment/register",
        json={"type": "Excavator", "tier": "Heavy", "dailyCost": 420},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "completed"
    assert body["catalogId"] == "CAT-EXC-H"
    assert body["qrCode"].startswith("QR-")


def test_checkout_then_return_good(client):
    checkout = client.post(
        "/api/equipment/checkout",
        json={
            "equipmentId": "EQX-1001",
            "siteId": "S001",
            "clientId": "C001",
            "operatorId": "OP999",
            "expectedReturn": "2026-09-01",
        },
    )
    assert checkout.status_code == 200
    assert checkout.json()["status"] == "active"

    ret = client.post("/api/equipment/EQX-1001/return", json={"condition": "good"})
    assert ret.status_code == 200
    assert ret.json()["status"] == "completed"
    assert ret.json()["operatorId"] is None


def test_return_damaged_sends_to_maintenance(client):
    client.post(
        "/api/equipment/checkout",
        json={"equipmentId": "EQX-1002", "siteId": "S001", "clientId": "C001", "expectedReturn": "2026-09-01"},
    )
    ret = client.post(
        "/api/equipment/EQX-1002/return",
        json={"condition": "damaged", "notes": "Cracked hydraulic line"},
    )
    assert ret.status_code == 200
    body = ret.json()
    assert body["status"] == "maintenance"
    assert body["maintenanceNote"] == "Cracked hydraulic line"


def test_batch_checkout(client):
    res = client.post(
        "/api/equipment/checkout/batch",
        json={
            "equipmentIds": ["EQX-1003", "EQX-1004"],
            "siteId": "S002",
            "clientId": "C002",
            "expectedReturn": "2026-09-15",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    assert all(e["status"] == "active" for e in body)
    assert all(e["operatorId"] is None for e in body)


def test_hold(client):
    res = client.post(
        "/api/equipment/hold",
        json={"equipmentIds": ["EQX-1005"], "clientId": "C003", "siteId": "S003"},
    )
    assert res.status_code == 200
    assert res.json()[0]["status"] == "hold"


def test_extend_rental(client):
    res = client.post("/api/equipment/EQX-2001/extend", json={"extraDays": 7})
    assert res.status_code == 200
    assert res.json()["expectedReturn"] == "2026-08-27"


def test_request_return(client):
    res = client.post("/api/equipment/EQX-2004/request-return")
    assert res.status_code == 200
    assert res.json()["returnRequested"] is True


def test_accept_recommendation_success(client):
    # EQX-2002 is a barely-used Crane (Mobile Standard) — a cheaper Mini tier
    # comfortably covers its usage, so a rightsizing swap should apply.
    res = client.post("/api/equipment/EQX-2002/accept-recommendation")
    assert res.status_code == 200
    assert res.json()["tier"] == "Mini"
    assert res.json()["catalogId"] == "CAT-CRN-M"


def test_accept_recommendation_409_when_already_cheapest(client):
    # EQX-2004 is already on the cheapest Excavator tier (Compact) — no
    # cheaper alternative exists to recommend.
    res = client.post("/api/equipment/EQX-2004/accept-recommendation")
    assert res.status_code == 409


def test_unknown_equipment_404(client):
    assert client.get("/api/equipment/EQX-9999").status_code == 404
    assert client.post("/api/equipment/EQX-9999/extend", json={"extraDays": 1}).status_code == 404
