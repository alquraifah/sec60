"""
POST /analyze  — main feasibility analysis endpoint.
"""

import json
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from services import solar_service, ml_service, financial_service, ai_service

logger = logging.getLogger(__name__)
router = APIRouter()

ASSUMPTIONS_FILE = Path(__file__).parent.parent / "data" / "assumptions.json"


def _load_assumptions():
    with open(ASSUMPTIONS_FILE, encoding="utf-8") as f:
        return json.load(f)


# ── Request schema ─────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    city: str = Field(..., description="City ID from /cities endpoint")
    facility_type: str = Field(..., description="residential|commercial|factory|farm|remote")
    system_type: str = Field("grid_tied", description="grid_tied|hybrid|off_grid")
    monthly_bill_sar: Optional[float] = Field(None, ge=0, description="Monthly electricity bill in SAR")
    monthly_consumption_kwh: Optional[float] = Field(None, ge=0, description="Monthly kWh consumption")
    area_sqm: Optional[float] = Field(None, ge=0, description="Available roof/land area in m²")
    demo_mode: bool = Field(False, description="Use seeded demo data (no external API calls)")

    @field_validator("facility_type")
    @classmethod
    def validate_facility(cls, v):
        valid = {"residential", "commercial", "factory", "farm", "remote"}
        if v not in valid:
            raise ValueError(f"facility_type must be one of {valid}")
        return v

    @field_validator("system_type")
    @classmethod
    def validate_system(cls, v):
        valid = {"grid_tied", "hybrid", "off_grid"}
        if v not in valid:
            raise ValueError(f"system_type must be one of {valid}")
        return v


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Full solar feasibility analysis.
    Returns system recommendation, financial metrics, AI explanation, and charts data.
    """
    a = _load_assumptions()

    # ── 1. Solar data ──────────────────────────────────────────────
    try:
        solar_data = await solar_service.get_solar_data(req.city)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Solar service error: {e}")
        raise HTTPException(status_code=502, detail="Failed to retrieve solar data")

    psh = solar_data["peak_sun_hours"]
    city = solar_data["city"]

    # ── 2. Consumption normalisation ───────────────────────────────
    tariff = a["electricity_tariff_sar_kwh"].get(req.facility_type, 0.18)

    if req.monthly_consumption_kwh:
        monthly_kwh = req.monthly_consumption_kwh
    elif req.monthly_bill_sar:
        monthly_kwh = req.monthly_bill_sar / tariff
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide either monthly_bill_sar or monthly_consumption_kwh"
        )

    # ── 3. First-pass financial for formula-mode feasibility ───────
    rough_size = ml_service._formula_system_size(monthly_kwh, psh, req.area_sqm)
    rough_fin = financial_service.calculate(
        rough_size, psh, req.facility_type, req.system_type,
        monthly_kwh, solar_data["monthly_factors"]
    )

    # ── 4. ML prediction ───────────────────────────────────────────
    ml_result = ml_service.predict(
        peak_sun_hours=psh,
        tariff=tariff,
        monthly_kwh=monthly_kwh,
        area_sqm=req.area_sqm,
        facility_type=req.facility_type,
        system_type=req.system_type,
        payback_years=rough_fin["payback_years"],
        roi_25=rough_fin["roi_25yr_pct"],
    )

    system_kw = ml_result["system_size_kw"]

    # ── 5. Final financial calculation ─────────────────────────────
    fin = financial_service.calculate(
        system_kw, psh, req.facility_type, req.system_type,
        monthly_kwh, solar_data["monthly_factors"]
    )

    # Recalculate feasibility with final numbers if formula was used
    if ml_result["model_used"] == "formula_fallback":
        ml_result["feasibility_score"] = ml_service._formula_feasibility(
            fin["payback_years"], fin["roi_25yr_pct"], psh, tariff
        )

    feasibility_score = ml_result["feasibility_score"]

    # ── 6. AI explanation ──────────────────────────────────────────
    explanation = ai_service.generate(
        city=city,
        facility_type=req.facility_type,
        system_type=req.system_type,
        system_size_kw=fin["actual_system_kw"],
        feasibility_score=feasibility_score,
        financial=fin,
        solar_data=solar_data,
    )

    # ── 7. Labels ─────────────────────────────────────────────────
    facility_labels = a.get("facility_type_descriptions", {})
    system_labels = a.get("system_type_descriptions", {})

    return {
        "city": city,
        "solar_data": {
            "peak_sun_hours": psh,
            "avg_temp_c": solar_data["avg_temp"],
            "data_source": solar_data["data_source"],
        },
        "system": {
            "recommended_kw": system_kw,
            "actual_kw": fin["actual_system_kw"],
            "num_panels": fin["num_panels"],
        },
        "financial": fin,
        "feasibility_score": round(feasibility_score, 1),
        "ml_model_used": ml_result["model_used"],
        "ai_explanation": explanation,
        "facility_type": req.facility_type,
        "facility_type_label": facility_labels.get(req.facility_type, {}).get("ar", req.facility_type),
        "system_type": req.system_type,
        "system_type_label": system_labels.get(req.system_type, {}).get("ar", req.system_type),
        "monthly_kwh_input": round(monthly_kwh, 1),
        "assumptions": {
            "panel_wattage_w": a["panel_wattage_w"],
            "system_losses_pct": a["system_losses_pct"],
            "system_lifetime_years": a["system_lifetime_years"],
            "degradation_rate_pct_per_year": a["degradation_rate_pct_per_year"],
            "maintenance_cost_pct_of_capex": a["maintenance_cost_pct_of_capex"],
            "co2_factor_kg_per_kwh": a["co2_factor_kg_per_kwh"],
        },
    }
