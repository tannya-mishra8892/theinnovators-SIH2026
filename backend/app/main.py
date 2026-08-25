from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    weather,
    chat,
    risk,
    hazards,
    alerts,
    emergency,
    simulation,
    zones,
    routes,
    location,
    voice,
)

from app.config import USE_DEMO_WEATHER, USE_DEMO_LLM


app = FastAPI(
    title="WeatherGPT API",
    description="AI Weather & Disaster Intelligence backend — SIH26068 / SIH26071 prototype",
    version="0.1.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# API ROUTERS
# --------------------------------------------------

app.include_router(
    weather.router,
    prefix="/api",
    tags=["weather"],
)

app.include_router(
    chat.router,
    prefix="/api",
    tags=["chat"],
)

app.include_router(
    risk.router,
    prefix="/api",
    tags=["risk"],
)

app.include_router(
    hazards.router,
    prefix="/api",
    tags=["hazards"],
)

app.include_router(
    alerts.router,
    prefix="/api",
    tags=["alerts"],
)

app.include_router(
    emergency.router,
    prefix="/api",
    tags=["emergency"],
)

app.include_router(
    simulation.router,
    prefix="/api",
    tags=["simulation"],
)

app.include_router(
    zones.router,
    prefix="/api",
    tags=["zones"],
)

app.include_router(
    routes.router,
    prefix="/api",
    tags=["routes"],
)

# Reverse Geocoding / Location
app.include_router(
    location.router,
    prefix="/api",
    tags=["location"],
)

# Voice Command
app.include_router(
    voice.router,
    prefix="/api",
    tags=["voice"],
)


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
async def root():
    return {
        "status": "ok",
        "project": "WeatherGPT",
        "demo_mode": {
            "weather": USE_DEMO_WEATHER,
            "llm": USE_DEMO_LLM,
        },
        "docs": "/docs",
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
async def health():
    return {
        "status": "healthy"
    }