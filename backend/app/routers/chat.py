from fastapi import APIRouter
from pydantic import BaseModel

from app.services.weather_service import get_current_weather
from app.services.risk_engine import (
    inundation_risk,
    personal_risk_score,
)
from app.services.rag import retrieve
from app.services.groq_client import generate_chat_response
from app.routers.hazards import count_hazards_near


router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    lat: float
    lon: float


@router.post("/chat")
async def chat(req: ChatRequest):

    # ==================================================
    # 1. WEATHER
    # ==================================================

    weather = await get_current_weather(
        req.lat,
        req.lon,
    )

    # ==================================================
    # 2. INUNDATION
    # ==================================================

    rain_mm = weather.get(
        "rain_mm_1h",
        0.0,
    )

    inund = inundation_risk(
        req.lat,
        req.lon,
        rain_mm,
    )

    # ==================================================
    # 3. NEARBY HAZARDS
    # ==================================================

    hazards_nearby = count_hazards_near(
        req.lat,
        req.lon,
        radius_km=2.0,
    )

    # ==================================================
    # 4. LIGHTNING
    # ==================================================

    rainfall_intensity = inund.get(
        "rainfall_intensity",
        "NONE",
    )

    lightning_prob = (
        0.35
        if rainfall_intensity in (
            "HEAVY",
            "SEVERE",
        )
        else 0.05
    )

    # ==================================================
    # 5. PERSONAL RISK
    # ==================================================

    risk = personal_risk_score(
        weather,
        inund,
        lightning_prob=lightning_prob,
        hazard_count=hazards_nearby,
    )

    # ==================================================
    # 6. RAG
    # ==================================================

    retrieved_docs = retrieve(
        req.message,
        top_k=4,
    )

    # ==================================================
    # 7. COMPLETE AI CONTEXT
    # ==================================================

    context = {
        "weather": weather,

        "risk": risk,

        "inundation": inund,

        "nearby_hazards": hazards_nearby,

        "location": {
            "lat": req.lat,
            "lon": req.lon,
        },

        "query": req.message,
    }

    # ==================================================
    # 8. AI RESPONSE
    # ==================================================

    reply = await generate_chat_response(
        req.message,
        context,
        retrieved_docs,
    )

    # ==================================================
    # 9. RESPONSE
    # ==================================================

    return {
        "reply": reply,

        "context_used": {
            "weather": weather,

            "risk": risk,

            "inundation": inund,

            "nearby_hazards": hazards_nearby,

            "retrieved_docs": [
                d.get(
                    "id",
                    "unknown",
                )
                for d in retrieved_docs
            ],
        },
    }