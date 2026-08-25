from fastapi import APIRouter, HTTPException

from app.services.weather_service import get_current_weather
from app.services.risk_engine import (
    inundation_risk,
    personal_risk_score,
)
from app.services.alert_intelligence import (
    build_alert_summary,
)
from app.routers.hazards import count_hazards_near


router = APIRouter()


@router.get("/intelligence")
async def intelligence(
    lat: float,
    lon: float,
):
    """
    Phase 8 — WeatherGPT Intelligence API

    Combines:
    Weather + Inundation + Personal Risk +
    Nearby Hazards + Alert Intelligence
    """

    try:
        # 1. Current weather
        weather = await get_current_weather(
            lat,
            lon,
        )

        # 2. Inundation assessment
        rain = weather.get(
            "rain_mm_1h",
            0.0,
        )

        inundation = inundation_risk(
            lat,
            lon,
            rain,
        )

        # 3. Nearby hazards
        hazard_count = count_hazards_near(
            lat,
            lon,
            radius_km=2.0,
        )

        # 4. Lightning estimate
        lightning_prob = (
            0.35
            if inundation.get(
                "rainfall_intensity"
            ) in ("HEAVY", "SEVERE")
            else 0.05
        )

        # 5. Personal risk
        risk = personal_risk_score(
            weather,
            inundation,
            lightning_prob=lightning_prob,
            hazard_count=hazard_count,
        )

        # 6. Alert intelligence
        intelligence_data = build_alert_summary(
            risk=risk,
            inundation=inundation,
            hazard_count=hazard_count,
        )

        return {
            "status": "success",
            "location": {
                "lat": lat,
                "lon": lon,
            },
            "weather": weather,
            "inundation": inundation,
            "risk": risk,
            "nearby_hazards": hazard_count,
            "intelligence": intelligence_data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Intelligence engine failed: {str(e)}",
        )