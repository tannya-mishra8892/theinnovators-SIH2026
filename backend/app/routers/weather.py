from fastapi import APIRouter, Query
from app.services.weather_service import get_current_weather

router = APIRouter()


@router.get("/weather")
async def weather(lat: float = Query(...), lon: float = Query(...)):
    data = await get_current_weather(lat, lon)
    return data
