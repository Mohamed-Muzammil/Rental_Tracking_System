import logging
import random
from datetime import date
from ..db import get_supabase
from ..seed_data.sites import SITES
from ..seed_data.generate_logs import gen_daily_logs

logger = logging.getLogger(__name__)

def generate_daily_telemetry():
    """Generates dummy telemetry logs for all active equipment for today."""
    try:
        supabase = get_supabase()
        today_str = date.today().isoformat()
        
        # Check if logs for today already exist (to avoid duplicate runs if triggered manually/restarted)
        existing = supabase.table("usage_logs").select("id").eq("date", today_str).limit(1).execute()
        if existing.data:
            logger.info(f"Telemetry for {today_str} already exists. Skipping.")
            return

        # Fetch all active equipment
        response = supabase.table("equipment").select("*").eq("status", "active").execute()
        active_eqs = response.data
        
        if not active_eqs:
            logger.info("No active equipment to generate telemetry for.")
            return

        # site_by_id dictionary
        site_by_id = {s["id"]: s for s in SITES}
        
        new_logs = []
        for eq in active_eqs:
            # Generate 1 day of logs
            logs = gen_daily_logs(
                equipment_id=eq["id"],
                operator_id=eq["operator_id"],
                site_id=eq["site_id"],
                start_date=today_str,
                days=1,
                base_engine=eq.get("avg_engine_hours_per_day") or 4.0,
                base_idle=eq.get("avg_idle_hours_per_day") or 1.0,
                site_by_id=site_by_id,
                drift_km=0,
                fuel_factor=1
            )
            new_logs.extend(logs)
        
        if new_logs:
            supabase.table("usage_logs").insert(new_logs).execute()
            logger.info(f"Generated telemetry logs for {len(new_logs)} active units for {today_str}.")

    except Exception as e:
        logger.exception(f"Failed to generate daily telemetry: {e}")
