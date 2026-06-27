"""
POST /forecast — 5-year electricity cost comparison: with solar vs without solar.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class ForecastRequest(BaseModel):
    monthly_bill_sar: float = Field(..., gt=0)
    annual_savings_sar: float = Field(..., ge=0)
    tariff_increase_pct: float = Field(3.0, ge=0, le=20, description="Annual tariff increase %")
    consumption_growth_pct: float = Field(2.0, ge=0, le=20, description="Annual consumption growth %")


@router.post("/forecast")
def forecast(req: ForecastRequest):
    """Compare 5-year electricity costs with and without solar."""
    years = []
    annual_bill = req.monthly_bill_sar * 12
    annual_savings = req.annual_savings_sar
    tariff_growth = 1 + req.tariff_increase_pct / 100
    consumption_growth = 1 + req.consumption_growth_pct / 100

    total_without = 0.0
    total_with = 0.0

    for yr in range(1, 6):
        bill_without = annual_bill * (tariff_growth ** (yr - 1)) * (consumption_growth ** (yr - 1))
        degradation = 0.995 ** (yr - 1)
        bill_with = max(0, bill_without - annual_savings * degradation)

        total_without += bill_without
        total_with += bill_with

        years.append({
            "year": yr,
            "without_solar_sar": round(bill_without),
            "with_solar_sar": round(bill_with),
            "savings_sar": round(bill_without - bill_with),
        })

    return {
        "years": years,
        "total_without_solar_sar": round(total_without),
        "total_with_solar_sar": round(total_with),
        "total_savings_sar": round(total_without - total_with),
        "assumptions": {
            "tariff_increase_pct": req.tariff_increase_pct,
            "consumption_growth_pct": req.consumption_growth_pct,
        },
    }
