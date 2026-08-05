def test_reset_restores_original_counts(client):
    original = {
        "equipment": len(client.get("/api/equipment").json()),
        "sites": len(client.get("/api/sites").json()),
        "clients": len(client.get("/api/clients").json()),
        "catalog": len(client.get("/api/catalog").json()),
        "usageLogs": len(client.get("/api/usage-logs").json()),
        "incidents": len(client.get("/api/incidents").json()),
    }

    # Mutate a bunch of state.
    client.post("/api/equipment/register", json={"type": "Excavator", "tier": "Heavy"})
    client.post(
        "/api/equipment/checkout",
        json={"equipmentId": "EQX-1001", "siteId": "S001", "clientId": "C001", "expectedReturn": "2026-09-01"},
    )
    client.post("/api/incidents/INC-101/resolve", json={"actionType": "false_alarm"})
    client.post(
        "/api/usage-logs", json={"equipmentId": "EQX-2001", "engineHours": 3, "idleHours": 3}
    )

    assert len(client.get("/api/equipment").json()) == original["equipment"] + 1

    res = client.post("/api/admin/reset")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["counts"]["equipment"] == original["equipment"]
    assert body["counts"]["sites"] == original["sites"]
    assert body["counts"]["clients"] == original["clients"]
    assert body["counts"]["catalog"] == original["catalog"]
    assert body["counts"]["usage_logs"] == original["usageLogs"]
    assert body["counts"]["misuse_incidents"] == original["incidents"]

    assert len(client.get("/api/equipment").json()) == original["equipment"]
    assert client.get("/api/equipment/EQX-1001").json()["status"] == "completed"
    incident = next(i for i in client.get("/api/incidents").json() if i["id"] == "INC-101")
    assert incident["status"] == "active"
