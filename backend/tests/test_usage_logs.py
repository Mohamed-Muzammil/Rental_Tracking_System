def test_log_usage_with_explicit_location(client):
    res = client.post(
        "/api/usage-logs",
        json={
            "equipmentId": "EQX-2001",
            "engineHours": 6.5,
            "idleHours": 1.2,
            "fuelUsageL": 27.3,
            "operatorId": "OP101",
            "location": {"lat": 13.5, "lng": 80.5},
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["location"] == {"lat": 13.5, "lng": 80.5}
    assert body["id"] is not None

    eq = client.get("/api/equipment/EQX-2001").json()
    assert eq["avgEngineHoursPerDay"] == 6.5
    assert eq["avgIdleHoursPerDay"] == 1.2


def test_log_usage_falls_back_to_site_location(client):
    # EQX-2001 is assigned to site S001 (North Yard); omitting location
    # should fall back to that site's centre point.
    res = client.post(
        "/api/usage-logs",
        json={"equipmentId": "EQX-2001", "engineHours": 5.0, "idleHours": 2.0},
    )
    assert res.status_code == 200
    location = res.json()["location"]
    assert location == {"lat": 13.0827, "lng": 80.2707}


def test_log_usage_unknown_equipment_404(client):
    res = client.post(
        "/api/usage-logs", json={"equipmentId": "EQX-9999", "engineHours": 1, "idleHours": 1}
    )
    assert res.status_code == 404


def test_list_usage_logs_filters_by_equipment(client):
    all_logs = client.get("/api/usage-logs").json()
    scoped = client.get("/api/usage-logs", params={"equipmentId": "EQX-2003"}).json()
    assert len(scoped) < len(all_logs)
    assert all(l["equipmentId"] == "EQX-2003" for l in scoped)
