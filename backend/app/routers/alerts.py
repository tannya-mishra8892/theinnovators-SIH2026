from fastapi import APIRouter, Query
from datetime import datetime
from app.services.weather_service import get_current_weather
from app.services.risk_engine import inundation_risk, personal_risk_score
from app.routers.hazards import count_hazards_near

router = APIRouter()

LEVEL_MAP = {"LOW": "INFO", "MODERATE": "WATCH", "HIGH": "WARNING", "SEVERE": "SEVERE"}


@router.get("/alerts")
async def alerts(lat: float = Query(...), lon: float = Query(...), location_name: str = "Selected Location"):
    weather = await get_current_weather(lat, lon)
    inund = inundation_risk(lat, lon, weather.get("rain_mm_1h", 0.0))
    hazards_nearby = count_hazards_near(lat, lon, radius_km=2.0)
    lightning_prob = 0.35 if inund["rainfall_intensity"] in ("HEAVY", "SEVERE") else 0.05
    risk = personal_risk_score(weather, inund, lightning_prob=lightning_prob, hazard_count=hazards_nearby)

    level = LEVEL_MAP[risk["level"]]

    alert_list = []
    if level != "INFO":
        alert_list.append({
            "title": f"{inund['rainfall_intensity'].title()} Rainfall — Waterlogging Risk {inund['level']}",
            "threat": "Heavy Rainfall / Inundation",
            "location": location_name,
            "time": datetime.utcnow().isoformat() + "Z",
            "severity": level,
            "recommended_action": (
                "Avoid travel through known low-lying/flood-prone areas. Monitor official updates."
                if level in ("WARNING", "SEVERE")
                else "Stay alert to changing conditions."
            ),
        })
    if hazards_nearby >= 2:
        alert_list.append({
            "title": f"{hazards_nearby} community hazard reports nearby",
            "threat": "Ground-reported hazards",
            "location": location_name,
            "time": datetime.utcnow().isoformat() + "Z",
            "severity": "WATCH",
            "recommended_action": "Check the hazard map before choosing your route.",
        })

    return {"alert_level": level, "risk_score": risk["overall_score"], "alerts": alert_list}
