"""
SEC60 AI Prediction Service
Loads sec60_feasibility_model.pkl and runs ML predictions.
Falls back to physics-based formulas if model is missing.
"""

import math, logging
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)

MODEL_PKL = Path(__file__).parent.parent / "models" / "sec60_feasibility_model.pkl"

FACILITY_TYPES = ["residential", "commercial", "factory", "farm", "remote"]
SYSTEM_TYPES   = ["grid_tied", "hybrid", "off_grid"]

_bundle = None


def _load():
    global _bundle
    if _bundle is not None:
        return _bundle
    try:
        import joblib
        _bundle = joblib.load(MODEL_PKL)
        logger.info("SEC60 AI model loaded: %s", MODEL_PKL)
        return _bundle
    except Exception as e:
        logger.warning("Could not load SEC60 model (%s) — using formula fallback.", e)
        return None


def _formula_size(monthly_kwh: float, psh: float, area_sqm: float | None) -> float:
    eff = 0.85
    kw  = (monthly_kwh * 12) / (365 * psh * eff)
    if area_sqm and area_sqm > 0:
        area_kw = (area_sqm / 2.5) * 0.55
        kw = min(kw, area_kw)
    return max(1.0, kw)


def _formula_feasibility(payback: float, roi: float, psh: float, tariff: float) -> float:
    s  = max(0, min(20, (psh - 4) / 2.5 * 20))
    s += min(20, tariff / 0.30 * 20)
    if payback <= 5:    s += 35
    elif payback <= 8:  s += 28
    elif payback <= 12: s += 18
    elif payback <= 18: s += 8
    s += min(25, roi / 250 * 25)
    return max(0, min(100, s))


def predict(
    peak_sun_hours: float,
    tariff: float,
    monthly_kwh: float,
    area_sqm: float | None,
    facility_type: str,
    system_type: str,
    payback_years: float = 10.0,
    roi_25: float = 100.0,
) -> dict:
    """
    Returns:
        system_size_kw     – recommended system size
        feasibility_score  – 0–100
        model_used         – 'sec60_random_forest' or 'formula_fallback'
    """
    ft_enc = FACILITY_TYPES.index(facility_type) if facility_type in FACILITY_TYPES else 0
    st_enc = SYSTEM_TYPES.index(system_type)   if system_type   in SYSTEM_TYPES   else 0
    area   = area_sqm if area_sqm and area_sqm > 0 else 200.0

    bundle = _load()
    if bundle:
        try:
            X = np.array([[peak_sun_hours, tariff, monthly_kwh, area, ft_enc, st_enc]])
            size  = float(bundle["models"]["system_size_kw"].predict(X)[0])
            score = float(bundle["models"]["feasibility_score"].predict(X)[0])
            return {
                "system_size_kw":    max(1.0, round(size, 2)),
                "feasibility_score": round(max(0, min(100, score)), 1),
                "model_used":        "sec60_random_forest",
            }
        except Exception as e:
            logger.warning("Prediction failed: %s — falling back to formula.", e)

    size  = _formula_size(monthly_kwh, peak_sun_hours, area_sqm)
    score = _formula_feasibility(payback_years, roi_25, peak_sun_hours, tariff)
    return {
        "system_size_kw":    round(size, 2),
        "feasibility_score": round(score, 1),
        "model_used":        "formula_fallback",
    }
