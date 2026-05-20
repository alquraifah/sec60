"""
Financial calculations for solar feasibility analysis.
All monetary values in SAR; energy in kWh.
"""

import math
import json
from pathlib import Path

ASSUMPTIONS_FILE = Path(__file__).parent.parent / "data" / "assumptions.json"


def load_assumptions() -> dict:
    with open(ASSUMPTIONS_FILE, encoding="utf-8") as f:
        return json.load(f)


def calculate(
    system_size_kw: float,
    peak_sun_hours: float,
    facility_type: str,
    system_type: str,
    monthly_consumption_kwh: float,
    monthly_factors: list,
) -> dict:
    a = load_assumptions()

    panel_w = a["panel_wattage_w"]
    system_losses = a["system_losses_pct"] / 100
    days = a["days_per_month"]

    # ── System sizing ──────────────────────────────────────────────
    num_panels = math.ceil(system_size_kw * 1000 / panel_w)
    actual_kw = num_panels * panel_w / 1000

    # ── Production ─────────────────────────────────────────────────
    eff = 1 - system_losses
    avg_daily_kwh = actual_kw * peak_sun_hours * eff

    monthly_kwh = []
    for i in range(12):
        monthly_kwh.append(round(avg_daily_kwh * days[i] * monthly_factors[i], 1))

    annual_kwh = sum(monthly_kwh)

    # ── Tariff ─────────────────────────────────────────────────────
    tariffs = a["electricity_tariff_sar_kwh"]
    tariff = tariffs.get(facility_type, tariffs["residential"])

    # ── Savings ────────────────────────────────────────────────────
    annual_savings = annual_kwh * tariff

    # ── Capital cost ───────────────────────────────────────────────
    cost_table = a["installation_cost_per_kw_sar"]
    capex = actual_kw * cost_table.get(system_type, cost_table["grid_tied"])

    # Battery addition for hybrid / off-grid
    if system_type in ("hybrid", "off_grid"):
        daily_need = monthly_consumption_kwh / 30 if monthly_consumption_kwh else avg_daily_kwh
        autonomy = a["battery_days_autonomy"].get(system_type, 1)
        battery_kwh = daily_need * autonomy
        capex += battery_kwh * a["battery_cost_per_kwh_sar"]

    capex = round(capex)

    # ── Payback ────────────────────────────────────────────────────
    payback_years = capex / annual_savings if annual_savings > 0 else 99.0
    payback_years = round(payback_years, 1)

    # ── 25-year projection ─────────────────────────────────────────
    degradation = a["degradation_rate_pct_per_year"] / 100
    maintenance_annual = capex * a["maintenance_cost_pct_of_capex"] / 100
    savings_by_year = []
    cumulative = -capex

    for yr in range(1, 26):
        deg_factor = (1 - degradation) ** (yr - 1)
        yr_savings = annual_savings * deg_factor - maintenance_annual
        cumulative += yr_savings
        savings_by_year.append(
            {"year": yr, "savings": round(yr_savings), "cumulative": round(cumulative)}
        )

    total_net = sum(y["savings"] for y in savings_by_year)
    roi_25 = round((total_net / capex) * 100, 1) if capex > 0 else 0

    # ── Environmental ──────────────────────────────────────────────
    co2_factor = a["co2_factor_kg_per_kwh"]
    annual_co2_kg = annual_kwh * co2_factor
    annual_co2_tons = round(annual_co2_kg / 1000, 2)
    lifetime_co2_tons = round(annual_co2_tons * 25, 1)
    trees_equivalent = round(annual_co2_tons * 45)  # ~45 trees per ton CO₂/year

    return {
        "num_panels": num_panels,
        "actual_system_kw": round(actual_kw, 2),
        "daily_production_kwh": round(avg_daily_kwh, 2),
        "monthly_production_kwh": monthly_kwh,
        "annual_production_kwh": round(annual_kwh, 0),
        "tariff_sar_kwh": tariff,
        "annual_savings_sar": round(annual_savings),
        "monthly_savings_sar": round(annual_savings / 12),
        "installation_cost_sar": capex,
        "payback_years": payback_years,
        "roi_25yr_pct": roi_25,
        "savings_by_year": savings_by_year,
        "annual_co2_tons": annual_co2_tons,
        "lifetime_co2_tons": lifetime_co2_tons,
        "trees_equivalent": trees_equivalent,
    }
