"""
Train synthetic-data ML models for SEC60.

Generates a realistic dataset of Saudi solar projects, trains
RandomForestRegressor for system_size and GradientBoostingRegressor
for feasibility_score, then saves both as .pkl files.

Run manually:  python backend/models/train_model.py
Auto-run:      ml_service.py calls this if pkl files are missing.
"""

import math
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
import joblib

ROOT = Path(__file__).parent
MODELS_DIR = ROOT
DATA_DIR = ROOT.parent / "data"

# ── City / assumption data ─────────────────────────────────────────────────────
CITIES = {
    "riyadh": 6.2, "jeddah": 5.8, "dammam": 5.9, "qassim": 6.0,
    "madinah": 6.0, "makkah": 5.9, "tabuk": 6.3, "hail": 6.1,
    "abha": 5.5, "jazan": 5.3, "alula": 6.4, "najran": 6.0,
}

TARIFFS = {
    "residential": 0.18, "commercial": 0.20, "factory": 0.18,
    "farm": 0.10, "remote": 0.30,
}

COST_PER_KW = {"grid_tied": 3500, "hybrid": 5200, "off_grid": 6800}

FACILITY_TYPES = ["residential", "commercial", "factory", "farm", "remote"]
SYSTEM_TYPES = ["grid_tied", "hybrid", "off_grid"]

# Monthly consumption ranges (kWh) by facility type
CONSUMPTION_RANGE = {
    "residential": (150, 3000),
    "commercial": (500, 20000),
    "factory": (2000, 80000),
    "farm": (300, 10000),
    "remote": (50, 800),
}

AREA_RANGE = {
    "residential": (30, 500),
    "commercial": (100, 2000),
    "factory": (500, 8000),
    "farm": (500, 10000),
    "remote": (50, 1000),
}


def _system_size(monthly_kwh, psh, area_sqm):
    eff = 0.85
    consumption_kw = (monthly_kwh * 12) / (365 * psh * eff)
    area_kw = (area_sqm / 2.5) * 0.55
    return max(1.0, min(consumption_kw, area_kw * 1.2))


def _feasibility(capex, annual_savings, psh, tariff):
    payback = capex / annual_savings if annual_savings > 0 else 99
    roi_25 = (annual_savings * 25 - capex) / capex * 100 if capex > 0 else 0

    score = 0.0
    score += max(0, min(20, (psh - 4) / 2.5 * 20))
    score += min(20, tariff / 0.30 * 20)
    if payback <= 5:
        score += 35
    elif payback <= 8:
        score += 28
    elif payback <= 12:
        score += 18
    elif payback <= 18:
        score += 8
    score += min(25, roi_25 / 250 * 25)
    return max(0, min(100, score))


def generate_dataset(n=2000, seed=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    records = []

    for _ in range(n):
        city = rng.choice(list(CITIES.keys()))
        ft = rng.choice(FACILITY_TYPES)
        st = rng.choice(SYSTEM_TYPES)

        psh = CITIES[city] + rng.normal(0, 0.15)
        psh = float(np.clip(psh, 4.5, 7.5))

        tariff = TARIFFS[ft] + rng.normal(0, 0.005)
        tariff = float(np.clip(tariff, 0.05, 0.40))

        lo, hi = CONSUMPTION_RANGE[ft]
        monthly_kwh = float(rng.uniform(lo, hi))

        alo, ahi = AREA_RANGE[ft]
        area_sqm = float(rng.uniform(alo, ahi))

        sys_kw = _system_size(monthly_kwh, psh, area_sqm)
        sys_kw += float(rng.normal(0, sys_kw * 0.04))
        sys_kw = max(1.0, sys_kw)

        annual_prod = sys_kw * psh * 365 * 0.85
        annual_sav = annual_prod * tariff
        capex = sys_kw * COST_PER_KW[st]

        fs = _feasibility(capex, annual_sav, psh, tariff)
        fs += float(rng.normal(0, 2))
        fs = float(np.clip(fs, 0, 100))

        records.append({
            "peak_sun_hours": psh,
            "tariff": tariff,
            "monthly_kwh": monthly_kwh,
            "area_sqm": area_sqm,
            "facility_type_enc": FACILITY_TYPES.index(ft),
            "system_type_enc": SYSTEM_TYPES.index(st),
            "system_size_kw": round(sys_kw, 3),
            "feasibility_score": round(fs, 2),
        })

    return pd.DataFrame(records)


def train():
    print("Generating synthetic training dataset...")
    df = generate_dataset()
    print(f"  Generated {len(df)} samples.")

    FEATURES = ["peak_sun_hours", "tariff", "monthly_kwh", "area_sqm",
                "facility_type_enc", "system_type_enc"]
    X = df[FEATURES].values

    # ── System size model ──────────────────────────────────────────
    y_size = df["system_size_kw"].values
    X_tr, X_te, y_tr, y_te = train_test_split(X, y_size, test_size=0.2, random_state=42)

    size_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    size_model.fit(X_tr, y_tr)
    preds = size_model.predict(X_te)
    print(f"  [system_size] R²={r2_score(y_te, preds):.4f}  MAE={mean_absolute_error(y_te, preds):.2f} kW")

    # ── Feasibility score model ────────────────────────────────────
    y_fs = df["feasibility_score"].values
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X, y_fs, test_size=0.2, random_state=42)

    fs_model = GradientBoostingRegressor(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)
    fs_model.fit(X_tr2, y_tr2)
    preds2 = fs_model.predict(X_te2)
    print(f"  [feasibility]  R²={r2_score(y_te2, preds2):.4f}  MAE={mean_absolute_error(y_te2, preds2):.2f} pts")

    # ── Save ──────────────────────────────────────────────────────
    MODELS_DIR.mkdir(exist_ok=True)
    joblib.dump(size_model, MODELS_DIR / "system_size_model.pkl")
    joblib.dump(fs_model, MODELS_DIR / "feasibility_model.pkl")
    print(f"  Models saved to {MODELS_DIR}")


if __name__ == "__main__":
    train()
