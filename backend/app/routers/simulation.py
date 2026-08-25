from fastapi import APIRouter, Query
from app.services.weather_service import get_current_weather, simulate_rainfall_multiplier
from app.services.risk_engine import inundation_risk, FLOOD_ZONES

router = APIRouter()


@router.get("/simulation")
async def simulation(lat: float = Query(...), lon: float = Query(...), rainfall_increase_pct: float = Query(30)):
    """MODULE 10 — What-If Simulator. Clearly labelled scenario analysis, not a forecast."""
    base_weather = await get_current_weather(lat, lon)
    multiplier = 1 + (rainfall_increase_pct / 100)
    scenario_weather = simulate_rainfall_multiplier(base_weather, multiplier)

    current = inundation_risk(lat, lon, base_weather.get("rain_mm_1h", 0.0))
    scenario = inundation_risk(lat, lon, scenario_weather.get("rain_mm_1h", 0.0))

    # Rough "affected zones" count across the whole mock zone set for a city-wide picture
    def affected_zone_count(rain_mm):
        count = 0
        for z in FLOOD_ZONES:
            base_bump = {"low": 15, "moderate": 40, "high": 65}[z["base_risk"]]
            intensity_bump = min(45, rain_mm * 3)
            if base_bump + intensity_bump >= 45:
                count += 1
        return count

    return {
        "label": "SIMULATION / SCENARIO ANALYSIS — not an actual forecast",
        "rainfall_increase_pct": rainfall_increase_pct,
        "current": {"rain_mm_1h": base_weather.get("rain_mm_1h", 0.0), "inundation": current,
                    "affected_zones": affected_zone_count(base_weather.get("rain_mm_1h", 0.0))},
        "scenario": {"rain_mm_1h": scenario_weather.get("rain_mm_1h", 0.0), "inundation": scenario,
                     "affected_zones": affected_zone_count(scenario_weather.get("rain_mm_1h", 0.0))},
    }
