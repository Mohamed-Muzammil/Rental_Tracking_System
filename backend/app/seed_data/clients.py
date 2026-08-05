from .sites import SITES

# First 8 are an exact port of src/data/clients.js. C009+ are additional
# accounts added for a richer testing dataset (bigger seed scope).
_ORIGINAL = [
    {"id": "C001", "name": "Vertex Builders Ltd", "contact": "Priya Nair", "sites": ["S001", "S002"]},
    {"id": "C002", "name": "Summit Mining Co.", "contact": "Daniel Ortiz", "sites": ["S003", "S012"]},
    {"id": "C003", "name": "Coastal Infrastructure Pvt Ltd", "contact": "Wei Lin", "sites": ["S002", "S008"]},
    {"id": "C004", "name": "Ironvale Constructions", "contact": "Aisha Rahman", "sites": ["S005", "S007"]},
    {"id": "C005", "name": "Northline Civil Works", "contact": "Tomas Berg", "sites": ["S001", "S011"]},
    {"id": "C006", "name": "Blue Harbour Logistics", "contact": "Sofia Marchetti", "sites": ["S008", "S010"]},
    {"id": "C007", "name": "Redstone Aggregates", "contact": "Marcus Bell", "sites": ["S003", "S006"]},
    {"id": "C008", "name": "Apex Tunnelling Group", "contact": "Hana Kobayashi", "sites": ["S009"]},
]

_ADDITIONAL = [
    ("Meridian Earthworks", "Lucas Ferreira", ["S004", "S007"]),
    ("Granite Peak Contractors", "Emily Novak", ["S012", "S006"]),
    ("Cascade Infrastructure Group", "Noah Kim", ["S010", "S008"]),
    ("Union Bay Logistics", "Grace Adeyemi", ["S008"]),
    ("Highland Quarry Partners", "Ivan Petrov", ["S003", "S009"]),
    ("Sterling Civil Contractors", "Maya Desai", ["S005"]),
    ("Blackrock Aggregates", "Owen Fitzgerald", ["S006", "S012"]),
    ("Delta Port Works", "Camila Rossi", ["S008", "S002"]),
    ("Foundry Lane Builders", "Ethan Walsh", ["S001", "S004"]),
    ("Pioneer Site Services", "Amara Okafor", ["S011", "S007"]),
    ("Anchor Point Logistics", "Felix Nguyen", ["S010"]),
    ("Continental Earthmoving", "Sana Malik", ["S009", "S003"]),
]

CLIENTS = list(_ORIGINAL)
for i, (name, contact, sites) in enumerate(_ADDITIONAL, start=9):
    CLIENTS.append({"id": f"C{i:03d}", "name": name, "contact": contact, "sites": sites})

CLIENT_BY_ID = {c["id"]: c for c in CLIENTS}
