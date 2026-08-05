TODAY = "2026-08-05"  # matches src/lib/clock.js's SIM_TODAY exactly


def test_known_overdue_and_geofence_alerts(client):
    alerts = client.get("/api/alerts", params={"today": TODAY}).json()
    by_id = {a["id"]: a for a in alerts}

    # EQX-2002's expectedReturn (2026-08-02) is before TODAY -> overdue.
    assert "overdue-EQX-2002" in by_id
    assert by_id["overdue-EQX-2002"]["severity"] in ("critical", "serious")

    # EQX-2003 is seeded with a 6.5km geofence drift (usage_logs.py's
    # SEEDED_ANOMALIES), well past Hillside Quarry's radius.
    assert "geofence-EQX-2003" in by_id
    assert by_id["geofence-EQX-2003"]["severity"] == "critical"

    # EQX-2016 is seeded with a 1.8x fuel-burn factor -> fuel anomaly.
    assert "fuel-EQX-2016" in by_id


def test_alerts_only_cover_active_equipment(client):
    equipment = {e["id"]: e for e in client.get("/api/equipment").json()}
    alerts = client.get("/api/alerts", params={"today": TODAY}).json()
    for a in alerts:
        assert equipment[a["equipmentId"]]["status"] == "active"
