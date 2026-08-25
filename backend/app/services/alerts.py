from fastapi import APIRouter
from pydantic import BaseModel

from app.services.weather_service import get_current_weather
from app.services.risk_engine import inundation_risk, personal_risk_score
from app.services.alerts import generate_alerts
from app.routers.hazards import count_hazards_near


router = APIRouter()


class AlertsRequest(BaseModel):
    lat: float
    lon: float


@router.post("/alerts")
async def get_alerts(req: AlertsRequest):
    # ---------------------------------------------------------
    # 1. Current weather
    # ---------------------------------------------------------

    weather = await get_current_weather(
        req.lat,
        req.lon,
    )

    # ---------------------------------------------------------
    # 2. Inundation risk
    # ---------------------------------------------------------

    rain_mm = weather.get(
        "rain_mm_1h",
        0.0,
    )

    inundation = inundation_risk(
        req.lat,
        req.lon,
        rain_mm,
    )

    # ---------------------------------------------------------
    # 3. Nearby community hazards
    # ---------------------------------------------------------

    hazard_count = count_hazards_near(
        req.lat,
        req.lon,
        radius_km=2.0,
    )

    # ---------------------------------------------------------
    # 4. Lightning risk
    # ---------------------------------------------------------

    lightning_prob = (
        0.35
        if inundation["rainfall_intensity"] in (
            "HEAVY",
            "SEVERE",
        )
        else 0.05
    )

    # ---------------------------------------------------------
    # 5. Personal risk score
    # ---------------------------------------------------------

    risk = personal_risk_score(
        weather,
        inundation,
        lightning_prob=lightning_prob,
        hazard_count=hazard_count,
    )

    # ---------------------------------------------------------
    # 6. Generate alerts
    # ---------------------------------------------------------

    result = generate_alerts(
        weather=weather,
        risk=risk,
        inundation=inundation,
        hazard_count=hazard_count,
    )

    # ---------------------------------------------------------
    # 7. API response
    # ---------------------------------------------------------

    return {
        **result,
        "context": {
            "weather": weather,
            "risk": risk,
            "inundation": inundation,
            "hazard_count": hazard_count,
        },
    }