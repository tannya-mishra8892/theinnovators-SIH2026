from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.risk_engine import inundation_risk, rainfall_intensity_level
from app.services.weather_service import get_current_weather
from app.routers.hazards import count_hazards_near

router = APIRouter()


class RoutePoint(BaseModel):
    lat: float
    lon: float


class RouteCompareRequest(BaseModel):
    route_a: List[RoutePoint]
    route_b: List[RoutePoint]


async def _score_route(points: List[RoutePoint]):
    """PROTOTYPE — samples weather/inundation/hazards at each user-supplied checkpoint.
    Real system would use a routing API (OSRM/Mapbox Directions) to generate checkpoints
    automatically from source+destination; here the caller supplies them directly."""
    total_rain = 0.0
    max_inund_score = 0.0
    total_hazards = 0
    for p in points:
        w = await get_current_weather(p.lat, p.lon)
        total_rain += w.get("rain_mm_1h", 0.0)
        inund = inundation_risk(p.lat, p.lon, w.get("rain_mm_1h", 0.0))
        max_inund_score = max(max_inund_score, inund["score"])
        total_hazards += count_hazards_near(p.lat, p.lon, radius_km=1.0)

    avg_rain = total_rain / max(1, len(points))
    overall = min(100, max_inund_score * 0.6 + avg_rain * 3 + total_hazards * 10)
    level = "HIGH" if overall >= 55 else "MODERATE" if overall >= 25 else "LOW"

    return {
        "rain_risk": rainfall_intensity_level(avg_rain),
        "waterlogging_risk": "HIGH" if max_inund_score >= 45 else "MODERATE" if max_inund_score >= 20 else "LOW",
        "hazard_count": total_hazards,
        "overall_risk": level,
        "overall_score": round(overall, 1),
    }


@router.post("/routes/compare")
async def compare_routes(req: RouteCompareRequest):
    score_a = await _score_route(req.route_a)
    score_b = await _score_route(req.route_b)

    safer = "route_a" if score_a["overall_score"] <= score_b["overall_score"] else "route_b"
    return {
        "label": "PROTOTYPE ROUTE COMPARISON — checkpoints supplied by client; plug in a routing API for auto-generated checkpoints",
        "route_a": score_a,
        "route_b": score_b,
        "recommended": safer,
        "explanation": (
            f"{'Route A' if safer == 'route_a' else 'Route B'} is safer because it has lower predicted "
            f"inundation exposure and/or fewer active hazard reports along the checkpoints provided."
        ),
    }
