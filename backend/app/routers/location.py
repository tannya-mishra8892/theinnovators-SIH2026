from fastapi import APIRouter
import httpx

router = APIRouter()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"


@router.get("/location")
async def get_location(lat: float, lon: float):
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1,
        "zoom": 10,
    }

    headers = {
        "User-Agent": "WeatherGPT-SIH-Prototype/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                NOMINATIM_URL,
                params=params,
                headers=headers,
            )

            response.raise_for_status()
            data = response.json()

        address = data.get("address", {})

        city = (
            address.get("city")
            or address.get("town")
            or address.get("municipality")
            or address.get("village")
            or address.get("county")
            or "Unknown"
        )

        district = (
            address.get("state_district")
            or address.get("county")
            or ""
        )

        state = address.get("state", "")
        country = address.get("country", "")

        return {
            "lat": lat,
            "lon": lon,
            "city": city,
            "district": district,
            "state": state,
            "country": country,
            "display_name": data.get(
                "display_name",
                f"{city}, {state}"
            ),
        }

    except Exception as e:
        return {
            "lat": lat,
            "lon": lon,
            "city": "Unknown",
            "district": "",
            "state": "",
            "country": "India",
            "display_name": f"{lat:.4f}, {lon:.4f}",
            "error": str(e),
        }