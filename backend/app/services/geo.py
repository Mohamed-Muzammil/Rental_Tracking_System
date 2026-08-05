"""Python port of src/lib/geo.js — geofence + distance math, plus the
synthetic-telemetry helper used by both the demo log generator and the
"location omitted" fallback in the usage-log endpoint."""

import math
from typing import Optional

EARTH_RADIUS_KM = 6371


def _to_rad(deg: float) -> float:
    return deg * math.pi / 180


def distance_km(a: Optional[dict], b: Optional[dict]) -> Optional[float]:
    if not a or not b:
        return None
    d_lat = _to_rad(b["lat"] - a["lat"])
    d_lng = _to_rad(b["lng"] - a["lng"])
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(_to_rad(a["lat"])) * math.cos(_to_rad(b["lat"])) * math.sin(d_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(h))


def geofence_check(location: Optional[dict], site_id: Optional[str], site_by_id: dict) -> Optional[dict]:
    site = site_by_id.get(site_id) if site_id else None
    if not location or not site or location.get("lat") is None or location.get("lng") is None:
        return None

    km = distance_km(location, {"lat": site["lat"], "lng": site["lng"]})
    return {
        "site": site,
        "distanceKm": km,
        "radiusKm": site["radius_km"],
        "breach": km > site["radius_km"],
        "overshootKm": max(0.0, km - site["radius_km"]),
    }


def point_near_site(site_id: Optional[str], site_by_id: dict, offset_km: float = 0) -> Optional[dict]:
    site = site_by_id.get(site_id) if site_id else None
    if not site:
        return None
    return {
        "lat": round(site["lat"] + offset_km / 111, 5),
        "lng": site["lng"],
    }
