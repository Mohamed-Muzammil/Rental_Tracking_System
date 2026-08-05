EQUIPMENT_TYPES = {"Excavator", "Bulldozer", "Crane", "Grader", "Forklift", "Loader", "Roller"}


def test_train_returns_sane_metrics(client):
    res = client.post("/api/ml/train")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["categories"] == 7
    m = body["metrics"]
    assert m["mae"] > 0
    assert m["rmse"] > 0
    assert -1 <= m["r2"] <= 1


def test_forecast_shape_matches_frontend_contract(client):
    res = client.get("/api/ml/forecast")
    assert res.status_code == 200
    body = res.json()
    assert set(body["byCategory"].keys()) == EQUIPMENT_TYPES

    for category, points in body["byCategory"].items():
        projected = [p for p in points if p["actual"] is None and p["forecast"] is not None]
        assert len(projected) == body["horizonMonths"]

    assert isinstance(body["siteForecasts"], list)
    assert body["siteForecasts"]
