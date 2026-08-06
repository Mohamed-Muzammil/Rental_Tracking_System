from .sites import SITES

# First 8 are an exact port of src/data/clients.js. C009+ are additional
# accounts added for a richer testing dataset (bigger seed scope).
_ORIGINAL = [
    {
        "id": "C001", "name": "Vertex Builders Ltd", "contact": "Priya Nair", "sites": ["S001", "S002"],
        "description": "Vertex Builders specializes in high-rise commercial developments across the metro area. They have been a primary partner since 2018.",
        "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-101", "date": "2026-07-01", "amount": 15400, "status": "paid"},
            {"id": "INV-102", "date": "2026-08-01", "amount": 24500, "status": "paid"}
        ]
    },
    {
        "id": "C002", "name": "Summit Mining Co.", "contact": "Daniel Ortiz", "sites": ["S003", "S012"],
        "description": "Summit Mining Co. operates large-scale open-pit excavations. They require heavy-duty, high-availability machinery.",
        "overdue_amount": 12500, "fine_amount": 450, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-103", "date": "2026-06-15", "amount": 48000, "status": "paid"},
            {"id": "INV-104", "date": "2026-07-15", "amount": 12500, "status": "overdue"}
        ]
    },
    {
        "id": "C003", "name": "Coastal Infrastructure Pvt Ltd", "contact": "Wei Lin", "sites": ["S002", "S008"],
        "description": "A civil engineering firm focused on coastal defenses, bridge reinforcement, and port expansion projects.",
        "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-105", "date": "2026-07-10", "amount": 32000, "status": "paid"}
        ]
    },
    {
        "id": "C004", "name": "Ironvale Constructions", "contact": "Aisha Rahman", "sites": ["S005", "S007"],
        "description": "Ironvale handles suburban residential tract development and smaller municipal paving contracts.",
        "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-106", "date": "2026-07-01", "amount": 9800, "status": "paid"},
            {"id": "INV-107", "date": "2026-08-01", "amount": 11200, "status": "paid"}
        ]
    },
    {
        "id": "C005", "name": "Northline Civil Works", "contact": "Tomas Berg", "sites": ["S001", "S011"],
        "description": "Northline specializes in highway maintenance and emergency road repairs. Their fleet usage is highly variable.",
        "overdue_amount": 4500, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-108", "date": "2026-06-05", "amount": 22000, "status": "paid"},
            {"id": "INV-109", "date": "2026-07-05", "amount": 4500, "status": "overdue"}
        ]
    },
    {
        "id": "C006", "name": "Blue Harbour Logistics", "contact": "Sofia Marchetti", "sites": ["S008", "S010"],
        "description": "Blue Harbour operates large distribution warehouses and utilizes a high volume of forklifts and material handlers.",
        "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-110", "date": "2026-07-20", "amount": 18500, "status": "paid"}
        ]
    },
    {
        "id": "C007", "name": "Redstone Aggregates", "contact": "Marcus Bell", "sites": ["S003", "S006"],
        "description": "Redstone supplies raw materials and aggregates. They heavily use loaders and dumpers for quarry operations.",
        "overdue_amount": 0, "fine_amount": 850, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-111", "date": "2026-07-28", "amount": 34000, "status": "paid"}
        ]
    },
    {
        "id": "C008", "name": "Apex Tunnelling Group", "contact": "Hana Kobayashi", "sites": ["S009"],
        "description": "Apex focuses on deep underground tunneling and subway expansions. High-risk, high-margin projects.",
        "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0,
        "billing_history": [
            {"id": "INV-112", "date": "2026-07-01", "amount": 120000, "status": "paid"}
        ]
    },
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
    CLIENTS.append({
        "id": f"C{i:03d}", "name": name, "contact": contact, "sites": sites,
        "description": None, "overdue_amount": 0, "fine_amount": 0, "paid_fines": 0, "billing_history": []
    })

CLIENT_BY_ID = {c["id"]: c for c in CLIENTS}
