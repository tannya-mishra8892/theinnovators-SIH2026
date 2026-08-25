import json
import os
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "emergency_checklists.json")
with open(DATA_FILE) as f:
    CHECKLISTS = json.load(f)


@router.get("/emergency")
async def emergency(disaster_type: str = Query(..., description="flood | cyclone | landslide | lightning")):
    checklist = CHECKLISTS.get(disaster_type.lower())
    if not checklist:
        raise HTTPException(status_code=404, detail=f"No checklist for '{disaster_type}'. Available: {list(CHECKLISTS.keys())}")
    return {"label": "VERIFIED STATIC GUIDANCE (cacheable offline)", "disaster_type": disaster_type, **checklist}


@router.get("/emergency/all")
async def emergency_all():
    """Full bundle for offline caching (Module 16)."""
    return {"label": "OFFLINE CACHE BUNDLE", "checklists": CHECKLISTS}
