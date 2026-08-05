import pytest


@pytest.mark.parametrize(
    "action_type", ["false_alarm", "warn_operator", "penalty", "inspection", "recall"]
)
def test_resolve_each_action_type(client, action_type):
    res = client.post(
        "/api/incidents/INC-101/resolve", json={"actionType": action_type, "notes": "test note"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "resolved"
    assert body["resolution"] == action_type
    assert body["resolutionNotes"] == "test note"


def test_resolve_rejects_unknown_action_type(client):
    res = client.post("/api/incidents/INC-101/resolve", json={"actionType": "not_a_real_action"})
    assert res.status_code == 422


def test_resolve_unknown_incident_404(client):
    res = client.post("/api/incidents/INC-9999/resolve", json={"actionType": "false_alarm"})
    assert res.status_code == 404


def test_list_incidents_filters_by_status(client):
    active = client.get("/api/incidents", params={"status": "active"}).json()
    assert all(i["status"] == "active" for i in active)
    assert len(active) > 0
