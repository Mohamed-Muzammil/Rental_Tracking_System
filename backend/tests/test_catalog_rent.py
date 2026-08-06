def test_rent_allocates_existing_yard_stock_before_minting(client):
    catalog_id = "CAT-RLR-S"  # Roller / Single Drum
    equipment = client.get("/api/equipment").json()
    stock = [e for e in equipment if e["catalogId"] == catalog_id and e["status"] == "completed"]
    assert stock, "test fixture needs at least one completed unit of this tier"

    # Exhaust existing yard stock first — each of these rents must reuse an
    # idle unit rather than minting, and the fleet size must not grow.
    before_count = len(equipment)
    for _ in stock:
        res = client.post(f"/api/catalog/{catalog_id}/rent", json={"siteId": "S001", "clientId": "C001"})
        assert res.status_code == 200
        assert res.json()["allocated"] == "existing"

    after_stock_count = len(client.get("/api/equipment").json())
    assert after_stock_count == before_count

    # Now the yard has none left — the next rent must mint a brand-new unit.
    res = client.post(f"/api/catalog/{catalog_id}/rent", json={"siteId": "S001", "clientId": "C001"})
    assert res.status_code == 200
    assert res.json()["allocated"] == "new"

    after_mint_count = len(client.get("/api/equipment").json())
    assert after_mint_count == before_count + 1


def test_rent_unknown_catalog_item_404(client):
    res = client.post("/api/catalog/CAT-NOPE/rent", json={})
    assert res.status_code == 404
