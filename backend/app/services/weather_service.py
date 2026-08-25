import random
import httpx
from datetime import datetime
from app.config import OPENWEATHER_API_KEY, USE_DEMO_WEATHER

OWM_URL = "https://api.openweathermap.org/data/2.5/weather"
OWM_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"


def _demo_weather(lat: float, lon: float) -> dict:
    """Deterministic-ish demo data so the UI/story stays consistent across a demo run."""
    seed = int((abs(lat) + abs(lon)) * 100) % 5
    presets = [
        {"temp": 29.4, "rain_mm_1h": 0.0, "humidity": 68, "wind_kmh": 12, "visibility_km": 8, "condition": "Partly Cloudy"},
        {"temp": 26.1, "rain_mm_1h": 4.2, "humidity": 84, "wind_kmh": 21, "visibility_km": 4, "condition": "Moderate Rain"},
        {"temp": 24.8, "rain_mm_1h": 12.6, "humidity": 91, "wind_kmh": 34, "visibility_km": 2, "condition": "Heavy Rain"},
        {"temp": 31.0, "rain_mm_1h": 0.0, "humidity": 55, "wind_kmh": 9, "visibility_km": 10, "condition": "Clear"},
        {"temp": 27.5, "rain_mm_1h": 1.1, "humidity": 76, "wind_kmh": 15, "visibility_km": 6, "condition": "Light Rain"},
    ]
    data = presets[seed]
    return {
        "source": "DEMO_DATA",
        "label": "PROTOTYPE / DEMO WEATHER — set OPENWEATHER_API_KEY for live data",
        "lat": lat,
        "lon": lon,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **data,
    }


async def get_current_weather(lat: float, lon: float) -> dict:
    if USE_DEMO_WEATHER:
        return _demo_weather(lat, lon)

    params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OWM_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()
        return {
            "source": "LIVE_OPENWEATHERMAP",
            "label": "LIVE DATA",
            "lat": lat,
            "lon": lon,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "temp": raw.get("main", {}).get("temp"),
            "rain_mm_1h": raw.get("rain", {}).get("1h", 0.0),
            "humidity": raw.get("main", {}).get("humidity"),
            "wind_kmh": round((raw.get("wind", {}).get("speed") or 0) * 3.6, 1),
            "visibility_km": round((raw.get("visibility") or 10000) / 1000, 1),
            "condition": (raw.get("weather", [{}])[0] or {}).get("description", "unknown"),
        }
    except Exception:
        # Live API failed (bad key, rate limit, network) -> don't break the demo
        fallback = _demo_weather(lat, lon)
        fallback["label"] = "DEMO DATA (live API call failed, fell back automatically)"
        return fallback


def simulate_rainfall_multiplier(base_weather: dict, multiplier: float) -> dict:
    """Used by the What-If simulator (Module 10) — clearly a scenario, not a forecast."""
    scenario = dict(base_weather)
    scenario["rain_mm_1h"] = round(base_weather.get("rain_mm_1h", 0.0) * multiplier, 1)
    scenario["source"] = "SIMULATION"
    scenario["label"] = f"SCENARIO ANALYSIS — rainfall x{multiplier} (not a real forecast)"
    return scenario
