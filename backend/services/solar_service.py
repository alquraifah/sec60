"""
Solar data service.
Fetches live data from Open-Meteo API; falls back to local dataset if unavailable.
"""

import json
import httpx
from pathlib import Path

CITIES_FILE = Path(__file__).parent.parent / "data" / "saudi_cities.json"


def _load_cities() -> list:
    with open(CITIES_FILE, encoding="utf-8") as f:
        return json.load(f)["cities"]


def get_city(city_id: str) -> dict:
    cities = _load_cities()
    city = next((c for c in cities if c["id"] == city_id), None)
    if not city:
        raise ValueError(f"City '{city_id}' not found in dataset")
    return city


async def get_solar_data(city_id: str) -> dict:
    """Return solar data for the given city, with live API and local fallback."""
    city = get_city(city_id)

    # Try Open-Meteo for live radiation data
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": city["lat"],
                    "longitude": city["lon"],
                    "daily": "shortwave_radiation_sum",
                    "timezone": "Asia/Riyadh",
                    "forecast_days": 7,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                radiation_mj = data["daily"]["shortwave_radiation_sum"]
                # Convert MJ/m² → kWh/m² (÷ 3.6)
                avg_kwh = sum(radiation_mj) / len(radiation_mj) / 3.6
                avg_kwh = max(3.0, min(8.0, avg_kwh))  # sanity bounds for Saudi Arabia

                return {
                    "city": city,
                    "peak_sun_hours": round(avg_kwh, 2),
                    "avg_irradiance": round(avg_kwh, 2),
                    "avg_temp": city["avg_temp_c"],
                    "data_source": "open_meteo_live",
                    "monthly_factors": city["monthly_irradiance_factors"],
                }
    except Exception:
        pass  # fall through to local data

    # Local fallback
    return {
        "city": city,
        "peak_sun_hours": city["peak_sun_hours"],
        "avg_irradiance": city["avg_irradiance_kwh_m2_day"],
        "avg_temp": city["avg_temp_c"],
        "data_source": "local_dataset",
        "monthly_factors": city["monthly_irradiance_factors"],
    }
