import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, alerts, catalog, clients, dashboard, equipment, incidents, ml, reference, usage
from .services import ml_service
from apscheduler.schedulers.background import BackgroundScheduler
from .services.telemetry import generate_daily_telemetry

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
def startup_event() -> None:
    try:
        ml_service.load_from_disk_or_train()
        logger.info("ML forecast cache warmed")
    except Exception:
        logger.exception("Failed to warm ML forecast cache — /api/ml/forecast will train on first request")
        
    scheduler = BackgroundScheduler()
    scheduler.add_job(generate_daily_telemetry, 'cron', hour=0, minute=5)
    scheduler.start()
    logger.info("Started background telemetry scheduler (runs daily at 00:05).")
    
    # We can also generate right away if there are no logs for today yet
    generate_daily_telemetry()


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
