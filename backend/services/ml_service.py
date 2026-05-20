"""
ML prediction service.
Loads pre-trained RandomForest models from models/.
If models are missing, trains them automatically from synthetic data.
Formula-based fallback is always available.
"""

import json
import math
import logging
from pathlib import Path

import numpy as np

MODELS_DIR = Path(__file__).parent.parent / "models"
SIZE_MODEL_PATH = MODELS_DIR / "system_size_model.pkl"
SCORE_MODEL_PATH = MODELS_DIR / "feasibility_model.pkl"

logger = logging.getLogger(__name__)

# Encoding maps (must match train_model.py)
FACILITY_TYPES = ["residential", "commercial", "factory", "farm", "remote"]
SYSTEM_TYPES = ["grid_tied", "hybrid", "off_grid"]


def _formula_system_size(
    monthly_kwh: float,
    peak_sun_hours: float,
    area_sqm: float | None,
) -> float:
    """Physics-based fallback when model is unavailable."""
    sys_losses = 0.15
    eff = 1 - sys_losses
    consumption_kw = (monthly_kwh * 12) / (365 * peak_sun_hours * eff)

    if area_sqm and area_sqm > 0:
        # ~2.5 m² per 550W panel
        area_kw = (area_sqm / 2.5) * 0.55
        return max(1.0, min(consumption_kw, area_kw))

    return max(1.0, consumption_kw)


def _formula_feasibility(
    payback_years: float,
    roi_25: float,
    peak_sun_hours: float,
    tariff: float,
) -> float:
    score = 0.0
    # Irradiance (0–20)
    score += max(0, min(20, (peak_sun_hours - 4) / 2.5 * 20))
    # Tariff (0–20)
    score += min(20, tariff / 0.30 * 20)
    # Payback (0–35)
    if payback_years <= 5:
        score += 35
    elif payback_years <= 8:
        score += 28
    elif payback_years <= 12:
        score += 18
    elif payback_years <= 18:
        score += 8
    # ROI (0–25)
    score += min(25, roi_25 / 250 * 25)
    return max(0, min(100, score))


def _load_models():
    """Load joblib models lazily; return (size_model, score_model) or (None, None)."""
    try:
        import joblib
        sm = joblib.load(SIZE_MODEL_PATH)
        fm = joblib.load(SCORE_MODEL_PATH)
        return sm, fm
    except Exception as e:
        logger.warning(f"Could not load ML models: {e}. Using formula fallback.")
        return None, None


def _ensure_models():
    """Train models if pkl files are missing."""
    if not SIZE_MODEL_PATH.exists() or not SCORE_MODEL_PATH.exists():
        logger.info("ML models not found — training now from synthetic data...")
        try:
            import subprocess, sys
            train_script = MODELS_DIR / "train_model.py"
            subprocess.run([sys.executable, str(train_script)], check=True, timeout=120)
            logger.info("Training complete.")
        except Exception as e:
            logger.warning(f"Auto-training failed: {e}. Formula fallback will be used.")


def predict(
    peak_sun_hours: float,
    tariff: float,
    monthly_kwh: float,
    area_sqm: float | None,
    facility_type: str,
    system_type: str,
    # financial outputs needed for formula-based feasibility
    payback_years: float = 10.0,
    roi_25: float = 100.0,
) -> dict:
    """Return predicted system size (kW) and feasibility score (0–100)."""

    _ensure_models()
    size_model, score_model = _load_models()

    ft_enc = FACILITY_TYPES.index(facility_type) if facility_type in FACILITY_TYPES else 0
    st_enc = SYSTEM_TYPES.index(system_type) if system_type in SYSTEM_TYPES else 0
    area_val = area_sqm if area_sqm and area_sqm > 0 else 200.0

    features = np.array(
        [[peak_sun_hours, tariff, monthly_kwh, area_val, ft_enc, st_enc]]
    )

    if size_model is not None:
        try:
            system_kw = float(size_model.predict(features)[0])
            system_kw = max(1.0, system_kw)
            feasibility = float(score_model.predict(features)[0])
            feasibility = max(0.0, min(100.0, feasibility))
            return {
                "system_size_kw": round(system_kw, 2),
                "feasibility_score": round(feasibility, 1),
                "model_used": "random_forest",
            }
        except Exception as e:
            logger.warning(f"Model prediction failed: {e}. Using formula.")

    # Formula fallback
    system_kw = _formula_system_size(monthly_kwh, peak_sun_hours, area_sqm)
    feasibility = _formula_feasibility(payback_years, roi_25, peak_sun_hours, tariff)

    return {
        "system_size_kw": round(system_kw, 2),
        "feasibility_score": round(feasibility, 1),
        "model_used": "formula_fallback",
    }
