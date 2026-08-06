# Exact port of src/data/sites.js. Site ids must not change — they're
# hardcoded verbatim in ml/generate_dataset.py's SITES/REGION_AFFINITY.
SITES = [
    {"id": "S001", "name": "North Yard", "region": "Metro North", "lat": 13.0827, "lng": 80.2707, "radius_km": 2.5},
    {"id": "S002", "name": "Riverside Site", "region": "Metro East", "lat": 13.0500, "lng": 80.2820, "radius_km": 2.0},
    {"id": "S003", "name": "Hillside Quarry", "region": "Highlands", "lat": 12.9200, "lng": 80.1400, "radius_km": 4.0},
    {"id": "S004", "name": "East Depot", "region": "Metro East", "lat": 13.0650, "lng": 80.2960, "radius_km": 1.5},
    {"id": "S005", "name": "Central Plant", "region": "Metro Central", "lat": 13.0400, "lng": 80.2300, "radius_km": 2.0},
    {"id": "S006", "name": "Lakeside Project", "region": "Highlands", "lat": 12.8800, "lng": 80.1800, "radius_km": 3.0},
    {"id": "S007", "name": "Westgate Expansion", "region": "Metro West", "lat": 13.0300, "lng": 80.1600, "radius_km": 2.5},
    {"id": "S008", "name": "Harbour Terminal", "region": "Coastal", "lat": 13.1000, "lng": 80.3000, "radius_km": 2.0},
    {"id": "S009", "name": "Ridgeline Tunnel", "region": "Highlands", "lat": 12.8500, "lng": 80.1200, "radius_km": 3.5},
    {"id": "S010", "name": "Southfield Logistics", "region": "Metro South", "lat": 12.9500, "lng": 80.2200, "radius_km": 2.0},
    {"id": "S011", "name": "Airport Runway Ph2", "region": "Metro West", "lat": 12.9900, "lng": 80.1700, "radius_km": 3.0},
    {"id": "S012", "name": "Granite Ridge Mine", "region": "Highlands", "lat": 12.8000, "lng": 80.1000, "radius_km": 5.0},
]

SITE_BY_ID = {s["id"]: s for s in SITES}
