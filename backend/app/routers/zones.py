import json
import os
from fastapi import APIRouter

router = APIRouter()

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "flood_zones.json")


@router.get("/zones")
async def zones():
    with open(DATA_FILE) as f:
        return json.load(f)
