import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, alerts, catalog, clients, dashboard, equipment, incidents, ml, reference, usage
from .services import ml_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fleetloop")

app = FastAPI(title="FleetLoop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warm_ml_cache() -> None:
    try:
        ml_service.load_from_disk_or_train()
        logger.info("ML forecast cache warmed")
    except Exception:
        logger.exception("Failed to warm ML forecast cache — /api/ml/forecast will train on first request")


@app.get("/api/health")
def health():
    return {"ok": True}


app.include_router(reference.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(usage.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ml.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
