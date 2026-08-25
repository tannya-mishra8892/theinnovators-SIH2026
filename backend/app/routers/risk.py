from fastapi import APIRouter, Query
from app.services.weather_service import get_current_weather
from app.services.risk_engine import inundation_risk, personal_risk_score
from app.routers.hazards import load_hazards, count_hazards_near

router = APIRouter()


@router.get("/inundation")
async def inundation(lat: float = Query(...), lon: float = Query(...)):
    weather = await get_current_weather(lat, lon)
    return inundation_risk(lat, lon, weather.get("rain_mm_1h", 0.0))


@router.get("/risk")
async def risk(lat: float = Query(...), lon: float = Query(...)):
    weather = await get_current_weather(lat, lon)
    inund = inundation_risk(lat, lon, weather.get("rain_mm_1h", 0.0))
    hazards_nearby = count_hazards_near(lat, lon, radius_km=2.0)

    # Simple lightning proxy from rain intensity for the prototype
    lightning_prob = 0.35 if inund["rainfall_intensity"] in ("HEAVY", "SEVERE") else 0.05

    score = personal_risk_score(weather, inund, lightning_prob=lightning_prob, hazard_count=hazards_nearby)
    return {
        "weather": weather,
        "inundation": inund,
        "risk": score,
        "nearby_hazard_reports": hazards_nearby,
    }
