import json
import math
import os
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "hazards.json")


class HazardReport(BaseModel):
    lat: float
    lon: float
    category: str  # e.g. waterlogging, fallen_tree, road_blockage, electric_wire, landslide
    description: str = ""
    reporter_id: str = "anonymous"


def load_hazards():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)


def save_hazards(hazards):
    with open(DATA_FILE, "w") as f:
        json.dump(hazards, f, indent=2)


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def count_hazards_near(lat, lon, radius_km=2.0, hours=6):
    hazards = load_hazards()
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    count = 0
    for h in hazards:
        try:
            ts = datetime.fromisoformat(h["timestamp"].replace("Z", ""))
        except Exception:
            continue
        if ts < cutoff:
            continue
        if _haversine_km(lat, lon, h["lat"], h["lon"]) <= radius_km:
            count += 1
    return count


def _recompute_verification(hazards):
    """MODULE 11 — if >=2 reports of the SAME category within 300m and last 6h, mark VERIFIED."""
    for h in hazards:
        h["status"] = "REPORTED"

    for i, h in enumerate(hazards):
        matches = 0
        for j, other in enumerate(hazards):
            if h["category"] != other["category"]:
                continue
            if _haversine_km(h["lat"], h["lon"], other["lat"], other["lon"]) <= 0.3:
                try:
                    t1 = datetime.fromisoformat(h["timestamp"].replace("Z", ""))
                    t2 = datetime.fromisoformat(other["timestamp"].replace("Z", ""))
                except Exception:
                    continue
                if abs((t1 - t2).total_seconds()) <= 6 * 3600:
                    matches += 1
        if matches >= 2:
            h["status"] = "VERIFIED"
    return hazards


@router.get("/hazards")
async def list_hazards():
    return load_hazards()


@router.post("/hazards")
async def report_hazard(report: HazardReport):
    hazards = load_hazards()
    new_hazard = {
        "id": str(uuid.uuid4())[:8],
        "lat": report.lat,
        "lon": report.lon,
        "category": report.category,
        "description": report.description,
        "reporter_id": report.reporter_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "REPORTED",
    }
    hazards.append(new_hazard)
    hazards = _recompute_verification(hazards)
    save_hazards(hazards)
    return new_hazard
