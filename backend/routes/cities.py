"""
GET /cities  — returns list of supported Saudi cities with solar metadata.
NOTE: /health is defined in main.py (not here) to avoid route conflicts.
"""

import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()
CITIES_FILE = Path(__file__).parent.parent / "data" / "saudi_cities.json"


@router.get("/cities")
def get_cities():
    with open(CITIES_FILE, encoding="utf-8") as f:
        data = json.load(f)
    # Return slimmed city list for the frontend dropdown
    return {
        "cities": [
            {
                "id": c["id"],
                "name_ar": c["name_ar"],
                "name_en": c["name_en"],
                "peak_sun_hours": c["peak_sun_hours"],
                "region_ar": c.get("region_ar", ""),
            }
            for c in data["cities"]
        ]
    }


