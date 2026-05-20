"""
SEC60 ⚡ — منصة الجدوى الشمسية بالذكاء الاصطناعي
Streamlit version — deploys to Streamlit Cloud in one click.
"""

import math
import io
import json
import sys
import requests
import joblib
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import streamlit as st
from pathlib import Path
from datetime import datetime

# ── PDF imports ───────────────────────────────────────────────────────────────
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Page config — MUST be first Streamlit call ────────────────────────────────
st.set_page_config(
    page_title="SEC60 ⚡ الجدوى الشمسية",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Google Fonts + custom CSS ─────────────────────────────────────────────────
st.markdown("""
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
html, body, [class*="css"], .stApp {
    font-family: 'Cairo', 'Segoe UI', sans-serif !important;
}
.stApp { background: #f8fafc; }
div[data-testid="stAppViewContainer"] { background: #f8fafc; }

/* Header */
.sec60-header {
    background: linear-gradient(135deg, #0f172a 0%, #1a3a5c 60%, #0f172a 100%);
    padding: 2rem 2.5rem; border-radius: 20px; margin-bottom: 1.5rem; text-align: center;
}
.sec60-title { color: white; font-size: 2.6rem; font-weight: 800; margin: 0; }
.sec60-title span { color: #84cc16; }
.sec60-sub { color: #94a3b8; font-size: 1rem; margin-top: 0.4rem; }
.ai-badge {
    display: inline-block; background: rgba(132,204,22,0.15);
    border: 1px solid rgba(132,204,22,0.4); color: #84cc16;
    padding: 0.25rem 1rem; border-radius: 999px; font-size: 0.78rem;
    font-weight: 700; margin-top: 0.75rem;
}

/* Cards */
.metric-card {
    background: white; border-radius: 14px; padding: 1.1rem 1rem;
    border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    text-align: center; margin-bottom: 0.6rem;
}
.metric-val { font-size: 1.8rem; font-weight: 800; color: #84cc16; line-height: 1.1; }
.metric-val.cyan { color: #06b6d4; }
.metric-val.amber { color: #f59e0b; }
.metric-label { font-size: 0.8rem; color: #64748b; font-weight: 600; margin-top: 0.2rem; }
.metric-sub { font-size: 0.7rem; color: #94a3b8; }

/* AI Advisor */
.advisor-box {
    background: #f0fdf4; border-radius: 14px; padding: 1.5rem;
    border-left: 4px solid #84cc16; margin-top: 1rem;
}
.advisor-title { color: #0f172a; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; }
.advisor-badge {
    background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 700;
    padding: 0.2rem 0.75rem; border-radius: 999px; display: inline-block; margin-bottom: 0.75rem;
}
.reason-item { color: #1e293b; font-size: 0.87rem; margin: 0.3rem 0; padding-right: 0.5rem; }
.positioning {
    background: #eff6ff; border-radius: 10px; padding: 0.85rem 1rem;
    color: #1e40af; font-size: 0.82rem; font-weight: 600; margin-top: 1rem;
    border: 1px solid #bfdbfe;
}

/* Score badge */
.score-box {
    background: white; border-radius: 16px; padding: 1.5rem;
    border: 2px solid #84cc16; text-align: center; box-shadow: 0 2px 8px rgba(132,204,22,0.15);
}
.score-num { font-size: 3.5rem; font-weight: 800; color: #84cc16; line-height: 1; }
.score-label { font-size: 1.1rem; font-weight: 700; margin-top: 0.5rem; }

/* Section headers */
.section-hdr {
    font-size: 1rem; font-weight: 700; color: #0f172a;
    border-bottom: 2px solid #84cc16; padding-bottom: 0.4rem; margin: 1.2rem 0 0.8rem;
}

/* Arabic RTL blocks */
.rtl { direction: rtl; text-align: right; }

/* Streamlit widget overrides */
div[data-testid="stButton"] button {
    background: #84cc16; color: #0f172a; font-weight: 700;
    border: none; border-radius: 10px; width: 100%;
}
div[data-testid="stButton"] button:hover { background: #65a30d; }
div[data-testid="stDownloadButton"] button {
    background: #0f172a; color: white; font-weight: 700;
    border: none; border-radius: 10px; width: 100%;
}
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# DATA
# ═══════════════════════════════════════════════════════════════════════════════

CITIES = [
    {"id": "riyadh",  "ar": "الرياض",          "en": "Riyadh",  "psh": 6.2, "temp": 26.5,
     "mf": [0.82,0.86,0.94,0.99,1.02,1.00,0.97,0.98,1.00,0.98,0.90,0.82]},
    {"id": "jeddah",  "ar": "جدة",              "en": "Jeddah",  "psh": 5.8, "temp": 28.5,
     "mf": [0.84,0.88,0.95,0.99,1.01,1.00,0.98,0.99,1.00,0.97,0.91,0.84]},
    {"id": "dammam",  "ar": "الدمام",           "en": "Dammam",  "psh": 5.9, "temp": 27.0,
     "mf": [0.81,0.85,0.93,0.99,1.02,1.00,0.97,0.98,1.00,0.98,0.89,0.80]},
    {"id": "qassim",  "ar": "القصيم",           "en": "Qassim",  "psh": 6.0, "temp": 25.0,
     "mf": [0.82,0.87,0.95,1.00,1.03,1.01,0.97,0.98,1.00,0.97,0.89,0.81]},
    {"id": "madinah", "ar": "المدينة المنورة",  "en": "Madinah", "psh": 6.0, "temp": 26.0,
     "mf": [0.83,0.87,0.95,1.00,1.02,1.00,0.97,0.98,1.00,0.97,0.90,0.82]},
    {"id": "makkah",  "ar": "مكة المكرمة",     "en": "Makkah",  "psh": 5.9, "temp": 29.0,
     "mf": [0.84,0.88,0.95,0.99,1.01,1.00,0.98,0.99,1.00,0.97,0.91,0.84]},
    {"id": "tabuk",   "ar": "تبوك",             "en": "Tabuk",   "psh": 6.3, "temp": 22.5,
     "mf": [0.81,0.85,0.94,1.00,1.04,1.02,0.98,0.99,1.00,0.98,0.88,0.80]},
    {"id": "hail",    "ar": "حائل",             "en": "Hail",    "psh": 6.1, "temp": 22.0,
     "mf": [0.81,0.86,0.94,1.00,1.03,1.01,0.97,0.98,1.00,0.97,0.89,0.80]},
    {"id": "abha",    "ar": "أبها",             "en": "Abha",    "psh": 5.5, "temp": 18.0,
     "mf": [0.86,0.90,0.96,0.99,1.00,0.95,0.93,0.95,0.98,0.98,0.93,0.87]},
    {"id": "jazan",   "ar": "جيزان",            "en": "Jazan",   "psh": 5.3, "temp": 30.0,
     "mf": [0.86,0.90,0.96,0.99,1.01,0.98,0.96,0.97,0.99,0.98,0.92,0.86]},
    {"id": "alula",   "ar": "العُلا",           "en": "AlUla",   "psh": 6.4, "temp": 24.0,
     "mf": [0.81,0.85,0.93,0.99,1.03,1.01,0.97,0.98,1.01,0.99,0.89,0.80]},
    {"id": "najran",  "ar": "نجران",            "en": "Najran",  "psh": 6.0, "temp": 25.5,
     "mf": [0.85,0.89,0.96,1.00,1.02,1.00,0.97,0.98,1.00,0.98,0.91,0.85]},
]
CITY_MAP = {c["id"]: c for c in CITIES}

TARIFFS    = {"residential":0.18,"commercial":0.20,"factory":0.18,"farm":0.10,"remote":0.30}
COST_PER_KW= {"grid_tied":3500,"hybrid":5200,"off_grid":6800}
MONTHS_EN  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
DAYS       = [31,28,31,30,31,30,31,31,30,31,30,31]

FACILITY_LABELS = {
    "residential":"🏠 سكني",  "commercial":"🏢 تجاري",
    "factory":"🏭 مصنع",      "farm":"🌾 مزرعة", "remote":"🏔️ موقع نائي",
}
SYSTEM_LABELS = {
    "grid_tied":"⚡ مرتبط بالشبكة", "hybrid":"🔋 هجين", "off_grid":"🌐 مستقل",
}

# ═══════════════════════════════════════════════════════════════════════════════
# ML MODEL (optional — formula fallback if not found)
# ═══════════════════════════════════════════════════════════════════════════════

FACILITY_TYPES = ["residential","commercial","factory","farm","remote"]
SYSTEM_TYPES   = ["grid_tied","hybrid","off_grid"]

@st.cache_resource(show_spinner=False)
def _load_models():
    base = Path(__file__).parent
    paths = [
        base / "backend" / "models" / "system_size_model.pkl",
        base / "backend" / "models" / "feasibility_model.pkl",
    ]
    try:
        sm = joblib.load(paths[0])
        fm = joblib.load(paths[1])
        return sm, fm
    except Exception:
        return None, None

def _formula_size(kwh_month, psh, area):
    kw = (kwh_month * 12) / (365 * psh * 0.85)
    if area and area > 0:
        kw = min(kw, (area / 2.5) * 0.55)
    return max(1.0, kw)

def _formula_score(payback, roi, psh, tariff):
    s  = max(0, min(20, (psh-4)/2.5*20))
    s += min(20, tariff/0.30*20)
    if payback <= 5:   s += 35
    elif payback <= 8: s += 28
    elif payback <= 12:s += 18
    elif payback <= 18:s += 8
    s += min(25, roi/250*25)
    return max(0, min(100, s))

def ml_predict(psh, tariff, kwh_month, area, facility, system, payback=10, roi=100):
    sm, fm = _load_models()
    ft = FACILITY_TYPES.index(facility) if facility in FACILITY_TYPES else 0
    st_ = SYSTEM_TYPES.index(system)   if system   in SYSTEM_TYPES   else 0
    area_v = area if area and area > 0 else 200.0
    X = np.array([[psh, tariff, kwh_month, area_v, ft, st_]])
    if sm is not None:
        try:
            size  = float(sm.predict(X)[0])
            score = float(fm.predict(X)[0])
            return max(1.0, size), max(0, min(100, score)), "RandomForest ✅"
        except Exception:
            pass
    size  = _formula_size(kwh_month, psh, area)
    score = _formula_score(payback, roi, psh, tariff)
    return size, score, "Formula ⚙️"

# ═══════════════════════════════════════════════════════════════════════════════
# SOLAR DATA
# ═══════════════════════════════════════════════════════════════════════════════

@st.cache_data(ttl=3600, show_spinner=False)
def get_solar_psh(city_id: str) -> tuple[float, str]:
    city = CITY_MAP.get(city_id, CITIES[0])
    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={"latitude": city.get("lat", 24.7), "longitude": city.get("lon", 46.7),
                    "daily": "shortwave_radiation_sum", "timezone": "Asia/Riyadh",
                    "forecast_days": 7},
            timeout=5,
        )
        if r.status_code == 200:
            vals = r.json()["daily"]["shortwave_radiation_sum"]
            avg  = sum(vals) / len(vals) / 3.6
            return round(max(3.0, min(8.0, avg)), 2), "Open-Meteo (live)"
    except Exception:
        pass
    return city["psh"], "Local dataset"

# ═══════════════════════════════════════════════════════════════════════════════
# FINANCIAL
# ═══════════════════════════════════════════════════════════════════════════════

def calculate(city_id, facility, system, kwh_month, area, system_kw, psh):
    city      = CITY_MAP[city_id]
    tariff    = TARIFFS.get(facility, 0.18)
    panel_w   = 550
    losses    = 0.15
    eff       = 1 - losses

    num_panels     = math.ceil(system_kw * 1000 / panel_w)
    actual_kw      = num_panels * panel_w / 1000
    avg_daily      = actual_kw * psh * eff
    monthly_kwh    = [round(avg_daily * DAYS[i] * city["mf"][i], 1) for i in range(12)]
    annual_kwh     = sum(monthly_kwh)

    annual_sav     = annual_kwh * tariff
    capex          = actual_kw * COST_PER_KW.get(system, 3500)

    if system in ("hybrid", "off_grid"):
        daily_need = kwh_month / 30
        autonomy   = 1 if system == "hybrid" else 2
        capex     += daily_need * autonomy * 1600

    capex = round(capex)
    payback = capex / annual_sav if annual_sav > 0 else 99.0

    degradation = 0.005
    maint_annual = capex * 0.015
    savings_by_year = []
    cumulative = -capex
    for yr in range(1, 26):
        yr_sav = annual_sav * (1-degradation)**(yr-1) - maint_annual
        cumulative += yr_sav
        savings_by_year.append({"year":yr,"savings":round(yr_sav),"cumulative":round(cumulative)})

    total_net = sum(y["savings"] for y in savings_by_year)
    roi = round((total_net/capex)*100, 1) if capex > 0 else 0

    co2_kg         = annual_kwh * 0.4
    annual_co2     = round(co2_kg/1000, 2)
    trees_eq       = round(annual_co2 * 45)

    return {
        "num_panels":           num_panels,
        "actual_kw":            round(actual_kw, 2),
        "daily_kwh":            round(avg_daily, 2),
        "monthly_kwh":          monthly_kwh,
        "annual_kwh":           round(annual_kwh),
        "tariff":               tariff,
        "annual_sav":           round(annual_sav),
        "monthly_sav":          round(annual_sav/12),
        "capex":                capex,
        "payback":              round(payback, 1),
        "roi":                  roi,
        "savings_by_year":      savings_by_year,
        "annual_co2":           annual_co2,
        "trees_eq":             trees_eq,
    }

# ═══════════════════════════════════════════════════════════════════════════════
# AI ADVISOR
# ═══════════════════════════════════════════════════════════════════════════════

def rec_label(score):
    if score >= 80: return "مجدي جدًا ✅",  "#15803d", "green"
    if score >= 65: return "مجدي ✅",         "#65a30d", "lime"
    if score >= 45: return "متوسط الجدوى ⚡", "#b45309", "yellow"
    if score >= 20: return "يحتاج تحسين ⚙️", "#c2410c", "orange"
    return "غير مُوصى به ❌",                "#b91c1c", "red"

def advise(city_ar, psh, payback, roi, annual_sav, monthly_sav, score, system, facility):
    reasons, risks = [], []
    if psh >= 6.2: reasons.append(f"☀️ {city_ar} تتمتع بإشعاع شمسي استثنائي ({psh:.1f} ساعة/يوم)")
    elif psh >= 5.5: reasons.append(f"☀️ إشعاع شمسي ممتاز في {city_ar} ({psh:.1f} ساعة/يوم)")
    else: reasons.append(f"☀️ إشعاع شمسي جيد في {city_ar} ({psh:.1f} ساعة/يوم)")
    if roi > 200: reasons.append(f"💰 عائد استثمار مرتفع جداً ({roi:.0f}٪ خلال 25 سنة)")
    elif roi > 100: reasons.append(f"💰 عائد استثمار جيد ({roi:.0f}٪ خلال 25 سنة)")
    if payback < 7:  reasons.append(f"⏱ فترة استرداد قصيرة جداً ({payback:.1f} سنوات)")
    elif payback < 12: reasons.append(f"⏱ فترة استرداد معقولة ({payback:.1f} سنوات)")
    if annual_sav > 20000: reasons.append(f"💵 توفير سنوي مرتفع ({annual_sav:,.0f} ريال)")
    elif annual_sav > 5000: reasons.append(f"💵 توفير سنوي ملموس ({annual_sav:,.0f} ريال)")
    if facility == "farm": reasons.append("🌱 الطاقة الشمسية تُعزز الربحية الزراعية وتُخفض تكاليف الري")
    if payback > 15: risks.append(f"⚠️ فترة الاسترداد طويلة نسبياً ({payback:.1f} سنة)")
    if psh < 5.5:   risks.append(f"⚠️ الإشعاع الشمسي أقل من المتوسط المثالي")
    if system == "off_grid": risks.append("🔋 بطاريات Off-Grid تحتاج صيانة دورية وتجديد بعد 10-12 سنة")
    if not risks: risks.append("✅ لا توجد مخاطر جوهرية — التحليل إيجابي")
    steps = [
        f"📞 التواصل مع مزودي الطاقة المعتمدين في {city_ar}",
        "📋 طلب عروض أسعار مفصلة من 3 شركات على الأقل",
        "⚡ التحقق من متطلبات الربط بالشبكة مع شركة الكهرباء",
        "🏗 فحص الموقع للتأكد من الملاءمة الإنشائية",
        "📄 الاستفسار عن برامج دعم هيئة REPDO",
    ]
    summary = (f"بناءً على تحليل SEC60 لموقعك في {city_ar}، يُتوقع توفير "
               f"{monthly_sav:,.0f} ريال/شهر ({annual_sav:,.0f} ريال/سنة) "
               f"مع فترة استرداد تُقدَّر بـ {payback:.1f} سنوات.")
    return {"reasons":reasons,"risks":risks,"steps":steps,"summary":summary}

# ═══════════════════════════════════════════════════════════════════════════════
# PDF
# ═══════════════════════════════════════════════════════════════════════════════

def _ar(text):
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except Exception:
        return text

def _register_amiri():
    font_path = Path(__file__).parent / "backend" / "fonts" / "Amiri-Regular.ttf"
    if font_path.exists():
        try:
            pdfmetrics.registerFont(TTFont("Amiri", str(font_path)))
            return "Amiri"
        except Exception:
            pass
    return "Helvetica"

def build_pdf(city_ar, facility_label, system_label, fin, score, advisor, psh, ml_model):
    buf = io.BytesIO()
    FONT = _register_amiri()
    is_ar = FONT == "Amiri"

    NAVY  = colors.HexColor("#0f172a")
    LIME  = colors.HexColor("#84cc16")
    GRAY  = colors.HexColor("#475569")
    LIGHT = colors.HexColor("#f8fafc")
    LGRAY = colors.HexColor("#e2e8f0")
    GREEN = colors.HexColor("#15803d")
    WHITE = colors.white
    ALIGN = TA_RIGHT if is_ar else TA_LEFT

    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    story = []

    def ps(size=9, bold=False, align=ALIGN, color=GRAY):
        fn = (FONT if is_ar else ("Helvetica-Bold" if bold else "Helvetica"))
        return ParagraphStyle(f"s{id(size)}", fontName=fn, fontSize=size,
                              textColor=color, alignment=align, leading=size*1.6)

    def t(text): return _ar(text) if is_ar else text

    story.append(Paragraph("SEC60 ⚡", ps(20, True, TA_CENTER, NAVY)))
    story.append(Paragraph(t("تقرير الجدوى الاقتصادية للطاقة الشمسية"), ps(10, False, TA_CENTER, GRAY)))
    story.append(HRFlowable(width="100%", thickness=2, color=LIME, spaceAfter=8))
    story.append(Paragraph("AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor",
                            ps(8, True, TA_CENTER, colors.HexColor("#06b6d4"))))
    story.append(Spacer(1, 0.3*cm))

    # Meta
    meta = Table([
        [t("المدينة"), t(city_ar),         t("نوع المنشأة"), t(facility_label)],
        [t("نوع النظام"), t(system_label), t("التاريخ"),  datetime.now().strftime("%Y-%m-%d")],
    ], colWidths=[3.5*cm, 6*cm, 3.5*cm, 5*cm])
    meta.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,-1), FONT),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("TEXTCOLOR",(0,0),(-1,-1),GRAY),("TEXTCOLOR",(0,0),(0,-1),NAVY),
        ("TEXTCOLOR",(2,0),(2,-1),NAVY),
        ("ALIGN",(0,0),(-1,-1),"RIGHT" if is_ar else "LEFT"),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT,WHITE]),
        ("GRID",(0,0),(-1,-1),0.3,LGRAY),("TOPPADDING",(0,0),(-1,-1),4),
        ("BOTTOMPADDING",(0,0),(-1,-1),4),
    ]))
    story.append(meta); story.append(Spacer(1,0.3*cm))

    # Feasibility
    story.append(Paragraph(t("الجدوى الاقتصادية"), ps(11,True,ALIGN,NAVY)))
    rec_lbl, *_ = rec_label(score)
    fs_t = Table([[t("درجة الجدوى"), f"{score:.0f}/100",
                   t("التوصية"), t(rec_lbl)]],
                 colWidths=[4*cm,4*cm,4*cm,6*cm])
    fs_t.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,-1),FONT),("FONTSIZE",(0,0),(-1,-1),10),
        ("TEXTCOLOR",(1,0),(1,0),LIME),("TEXTCOLOR",(3,0),(3,0),LIME),
        ("ALIGN",(0,0),(-1,-1),"RIGHT" if is_ar else "LEFT"),
        ("BACKGROUND",(0,0),(-1,-1),LIGHT),
        ("GRID",(0,0),(-1,-1),0.3,LGRAY),("TOPPADDING",(0,0),(-1,-1),7),
        ("BOTTOMPADDING",(0,0),(-1,-1),7),
    ]))
    story.append(fs_t); story.append(Spacer(1,0.3*cm))

    # Financial
    story.append(Paragraph(t("التحليل المالي"), ps(11,True,ALIGN,NAVY)))
    fdata = [
        [t("تكلفة التركيب"), f"{fin['capex']:,.0f} SAR", t("التوفير السنوي"), f"{fin['annual_sav']:,.0f} SAR"],
        [t("التوفير الشهري"), f"{fin['monthly_sav']:,.0f} SAR/mo", t("فترة الاسترداد"), f"{fin['payback']:.1f} yrs"],
        [t("عائد الاستثمار 25 سنة"), f"{fin['roi']:.1f}%", t("تخفيض CO2"), f"{fin['annual_co2']:.2f} ton/yr"],
    ]
    ft = Table(fdata, colWidths=[4.5*cm,5*cm,4.5*cm,4*cm])
    ft.setStyle(TableStyle([
        ("FONTNAME",(0,0),(-1,-1),FONT),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("TEXTCOLOR",(0,0),(-1,-1),GRAY),("TEXTCOLOR",(0,0),(0,-1),NAVY),
        ("TEXTCOLOR",(2,0),(2,-1),NAVY),
        ("TEXTCOLOR",(1,0),(1,-1),GREEN),("TEXTCOLOR",(3,0),(3,-1),GREEN),
        ("ALIGN",(0,0),(-1,-1),"RIGHT" if is_ar else "LEFT"),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT,WHITE]),
        ("GRID",(0,0),(-1,-1),0.3,LGRAY),("TOPPADDING",(0,0),(-1,-1),5),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
    ]))
    story.append(ft); story.append(Spacer(1,0.3*cm))

    # AI Advisor
    story.append(Paragraph(t("مستشار SEC60 الذكي"), ps(11,True,ALIGN,NAVY)))
    story.append(Paragraph(t(advisor["summary"]), ps(9,False,ALIGN,GRAY)))
    story.append(Spacer(1,0.15*cm))
    story.append(Paragraph(t("العوامل الإيجابية:"), ps(9,True,ALIGN,NAVY)))
    for r in advisor["reasons"][:4]:
        story.append(Paragraph(t(r), ps(9,False,ALIGN,GRAY)))
    story.append(Spacer(1,0.15*cm))
    story.append(Paragraph(t("الخطوات التالية:"), ps(9,True,ALIGN,NAVY)))
    for s in advisor["steps"][:4]:
        story.append(Paragraph(t(s), ps(9,False,ALIGN,GRAY)))

    # Positioning
    story.append(Spacer(1,0.4*cm))
    pos = t("يُقدّم SEC60 تقييمًا ذكيًا للجدوى الشمسية لدعم قرارات الاستثمار في الطاقة بشكل أسرع وأكثر دقة.")
    story.append(Paragraph(pos, ps(8.5,False,TA_CENTER,NAVY)))
    story.append(Spacer(1,0.2*cm))
    story.append(Paragraph(f"Generated by SEC60 | {datetime.now().strftime('%Y-%m-%d')} | ML: {ml_model}",
                            ps(7.5,False,TA_CENTER,GRAY)))

    doc.build(story)
    buf.seek(0)
    return buf.read()

# ═══════════════════════════════════════════════════════════════════════════════
# HEADER
# ═══════════════════════════════════════════════════════════════════════════════

st.markdown("""
<div class="sec60-header">
  <div class="sec60-title">⚡ SEC<span>60</span></div>
  <div class="sec60-sub">منصة الجدوى الشمسية بالذكاء الاصطناعي — Saudi Solar Feasibility AI Platform</div>
  <div class="ai-badge">AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor</div>
</div>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# INPUT FORM
# ═══════════════════════════════════════════════════════════════════════════════

with st.form("sec60_input"):
    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown("**📍 المدينة**")
        city_id = st.selectbox(
            "المدينة", options=[c["id"] for c in CITIES],
            format_func=lambda x: f"{CITY_MAP[x]['ar']} — {CITY_MAP[x]['psh']} PSH",
            label_visibility="collapsed",
        )

        st.markdown("**🏗️ نوع المنشأة**")
        facility = st.selectbox(
            "نوع المنشأة", options=list(FACILITY_LABELS.keys()),
            format_func=lambda x: FACILITY_LABELS[x],
            label_visibility="collapsed",
        )

        st.markdown("**⚙️ نوع النظام**")
        system = st.selectbox(
            "نوع النظام", options=list(SYSTEM_LABELS.keys()),
            format_func=lambda x: SYSTEM_LABELS[x],
            label_visibility="collapsed",
        )

    with c2:
        st.markdown("**💡 الاستهلاك الشهري**")
        bill_mode = st.radio("طريقة الإدخال", ["بالريال (فاتورة)", "بالكيلوواط·ساعة"],
                             horizontal=True, label_visibility="collapsed")
        if bill_mode == "بالريال (فاتورة)":
            bill_sar = st.number_input("قيمة الفاتورة الشهرية (ريال)", min_value=50, value=500, step=50)
            bill_kwh = None
        else:
            bill_sar = None
            bill_kwh = st.number_input("الاستهلاك الشهري (كيلوواط·ساعة)", min_value=50, value=1500, step=100)

        st.markdown("**📐 المساحة المتاحة (م²) — اختياري**")
        area = st.number_input("المساحة", min_value=0, value=100, step=10, label_visibility="collapsed")
        if area == 0:
            area = None

    with c3:
        st.markdown("**ℹ️ معلومات المشروع**")
        city_info = CITY_MAP[city_id]
        st.info(
            f"**{city_info['ar']}**\n\n"
            f"☀️ ساعات الذروة: **{city_info['psh']}** PSH/يوم\n\n"
            f"🌡️ متوسط الحرارة: **{city_info['temp']}°C**\n\n"
            f"⚡ تعرفة: **{TARIFFS.get(facility, 0.18):.2f}** ريال/كيلوواط"
        )

        submitted = st.form_submit_button(
            "⚡ تحليل الجدوى الآن", use_container_width=True
        )

# Demo button outside form
demo_col, _ = st.columns([1, 3])
with demo_col:
    demo_clicked = st.button("🎯 تجربة سريعة (الرياض — سكني)", use_container_width=True)

# ═══════════════════════════════════════════════════════════════════════════════
# COMPUTE
# ═══════════════════════════════════════════════════════════════════════════════

def run_analysis(city_id, facility, system, bill_sar, bill_kwh, area):
    tariff = TARIFFS.get(facility, 0.18)
    if bill_kwh:
        kwh_month = bill_kwh
    elif bill_sar:
        kwh_month = bill_sar / tariff
    else:
        kwh_month = 1500

    with st.spinner("جارٍ جلب بيانات الإشعاع الشمسي…"):
        psh, data_src = get_solar_psh(city_id)

    # First pass: formula-based payback/roi for ML feature input
    size_rough = _formula_size(kwh_month, psh, area)
    fin_rough  = calculate(city_id, facility, system, kwh_month, area, size_rough, psh)

    with st.spinner("نموذج الذكاء الاصطناعي يُحلّل…"):
        sys_kw, score, ml_model = ml_predict(
            psh, tariff, kwh_month, area, facility, system,
            fin_rough["payback"], fin_rough["roi"]
        )

    fin      = calculate(city_id, facility, system, kwh_month, area, sys_kw, psh)
    city_ar  = CITY_MAP[city_id]["ar"]
    advisor  = advise(city_ar, psh, fin["payback"], fin["roi"],
                      fin["annual_sav"], fin["monthly_sav"], score, system, facility)

    return {"sys_kw":sys_kw,"score":score,"ml_model":ml_model,"psh":psh,
            "data_src":data_src,"fin":fin,"advisor":advisor,
            "city_ar":city_ar,"kwh_month":kwh_month}

if demo_clicked:
    with st.spinner("جارٍ تحميل البيانات التجريبية…"):
        st.session_state["result"] = run_analysis("riyadh","residential","grid_tied",500,None,100)

if submitted:
    st.session_state["result"] = run_analysis(city_id, facility, system, bill_sar, bill_kwh, area)

# ═══════════════════════════════════════════════════════════════════════════════
# RESULTS
# ═══════════════════════════════════════════════════════════════════════════════

if "result" not in st.session_state:
    st.markdown("""
    <div style="text-align:center;padding:3rem;color:#94a3b8;">
        <div style="font-size:3rem;">⚡</div>
        <p style="font-size:1.1rem;font-weight:600;">أدخل بيانات منشأتك أعلاه للحصول على تحليل الجدوى</p>
        <p style="font-size:0.85rem;">أو اضغط "تجربة سريعة" لرؤية مثال فوري</p>
    </div>
    """, unsafe_allow_html=True)
    st.stop()

R   = st.session_state["result"]
fin = R["fin"]
adv = R["advisor"]

st.divider()

# ── Feasibility score + data source ──────────────────────────────────────────
lbl, hex_color, _ = rec_label(R["score"])

top1, top2, top3 = st.columns([1.2, 2, 1])
with top1:
    st.markdown(f"""
    <div class="score-box">
      <div class="score-num" style="color:{hex_color};">{R['score']:.0f}</div>
      <div style="color:#64748b;font-size:0.75rem;">من 100</div>
      <div class="score-label" style="color:{hex_color};">{lbl}</div>
      <div style="font-size:0.7rem;color:#94a3b8;margin-top:0.5rem;">مؤشر الجدوى الاقتصادية</div>
    </div>
    """, unsafe_allow_html=True)

with top2:
    mc1, mc2 = st.columns(2)
    mc3, mc4 = st.columns(2)
    with mc1:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-val">{fin['actual_kw']:.1f}</div>
            <div class="metric-label">حجم النظام (kW)</div>
            <div class="metric-sub">{fin['num_panels']} لوح 550 واط</div>
        </div>""", unsafe_allow_html=True)
    with mc2:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-val">{fin['annual_sav']:,.0f}</div>
            <div class="metric-label">التوفير السنوي (ريال)</div>
            <div class="metric-sub">{fin['monthly_sav']:,.0f} ريال/شهر</div>
        </div>""", unsafe_allow_html=True)
    with mc3:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-val cyan">{fin['payback']:.1f}</div>
            <div class="metric-label">فترة الاسترداد (سنة)</div>
        </div>""", unsafe_allow_html=True)
    with mc4:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-val">{fin['roi']:.0f}%</div>
            <div class="metric-label">عائد الاستثمار 25 سنة</div>
        </div>""", unsafe_allow_html=True)

with top3:
    st.markdown(f"""<div class="metric-card" style="margin-bottom:0.6rem;">
        <div class="metric-val amber">{fin['capex']:,.0f}</div>
        <div class="metric-label">تكلفة التركيب (ريال)</div>
    </div>""", unsafe_allow_html=True)
    st.markdown(f"""<div class="metric-card" style="margin-bottom:0.6rem;">
        <div class="metric-val" style="color:#16a34a;">{fin['annual_co2']:.2f}</div>
        <div class="metric-label">تخفيض CO₂ (طن/سنة)</div>
        <div class="metric-sub">= {fin['trees_eq']} شجرة</div>
    </div>""", unsafe_allow_html=True)
    st.caption(f"☀️ {R['psh']} PSH | {R['data_src']} | {R['ml_model']}")

# ── Charts ────────────────────────────────────────────────────────────────────
st.markdown('<div class="section-hdr">📊 التحليل المالي والإنتاج</div>', unsafe_allow_html=True)
ch1, ch2 = st.columns(2)

with ch1:
    yrs = [y["year"] for y in fin["savings_by_year"]]
    cum = [y["cumulative"] for y in fin["savings_by_year"]]
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=yrs, y=cum, fill="tozeroy", mode="lines",
        line=dict(color="#84cc16", width=2.5),
        fillcolor="rgba(132,204,22,0.15)", name="صافي المدخرات التراكمية",
    ))
    fig.add_hline(y=0, line_dash="dash", line_color="#94a3b8", line_width=1)
    fig.add_hline(y=-fin["capex"], line_dash="dot", line_color="#06b6d4",
                  annotation_text="التكلفة الأولية", annotation_position="right")
    fig.update_layout(
        title="التدفق النقدي التراكمي — 25 سنة",
        xaxis_title="السنة", yaxis_title="ريال",
        paper_bgcolor="#ffffff", plot_bgcolor="#f8fafc",
        font=dict(family="Cairo", color="#1e293b"),
        margin=dict(t=40,b=40,l=10,r=10), height=300,
        legend=dict(x=0, y=1),
    )
    st.plotly_chart(fig, use_container_width=True)

with ch2:
    bar_colors = ["#84cc16" if v >= max(fin["monthly_kwh"])*0.92 else "#06b6d4"
                  for v in fin["monthly_kwh"]]
    fig2 = go.Figure(go.Bar(
        x=MONTHS_EN, y=fin["monthly_kwh"],
        marker_color=bar_colors, name="الإنتاج الشهري",
    ))
    fig2.update_layout(
        title="الإنتاج الشهري (كيلوواط·ساعة)",
        paper_bgcolor="#ffffff", plot_bgcolor="#f8fafc",
        font=dict(family="Cairo", color="#1e293b"),
        margin=dict(t=40,b=40,l=10,r=10), height=300,
    )
    st.plotly_chart(fig2, use_container_width=True)

# ── AI Advisor ────────────────────────────────────────────────────────────────
st.markdown('<div class="section-hdr">🤖 مستشار SEC60 الذكي</div>', unsafe_allow_html=True)

st.markdown(f"""
<div class="advisor-box">
  <div class="advisor-title">مستشار SEC60 الذكي — AI Advisor</div>
  <div class="advisor-badge">AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor</div>
  <p class="rtl" style="color:#1e293b;font-size:0.9rem;">{adv['summary']}</p>
</div>
""", unsafe_allow_html=True)

adv1, adv2 = st.columns(2)
with adv1:
    st.markdown("**✅ العوامل الإيجابية**")
    for r in adv["reasons"]:
        st.markdown(f'<div class="reason-item rtl">{r}</div>', unsafe_allow_html=True)

with adv2:
    st.markdown("**⚠️ اعتبارات مهمة**")
    for r in adv["risks"]:
        st.markdown(f'<div class="reason-item rtl">{r}</div>', unsafe_allow_html=True)

st.markdown("**➡️ الخطوات التالية**")
for i, s in enumerate(adv["steps"], 1):
    st.markdown(f'<div class="reason-item rtl">{i}. {s}</div>', unsafe_allow_html=True)

st.markdown("""
<div class="positioning">
    يُقدّم SEC60 تقييمًا ذكيًا للجدوى الشمسية لدعم قرارات الاستثمار في الطاقة بشكل أسرع وأكثر دقة.
    تم توليد النتائج باستخدام بيانات الإشعاع الشمسي الحية وتحليل الاستهلاك ونمذجة مالية بالذكاء الاصطناعي.
</div>
""", unsafe_allow_html=True)

# ── PDF download ──────────────────────────────────────────────────────────────
st.markdown('<div class="section-hdr">📄 تحميل التقرير</div>', unsafe_allow_html=True)

pdf_bytes = build_pdf(
    R["city_ar"], FACILITY_LABELS.get(facility,""), SYSTEM_LABELS.get(system,""),
    fin, R["score"], adv, R["psh"], R["ml_model"],
)
st.download_button(
    label="📥 تحميل تقرير PDF الكامل",
    data=pdf_bytes,
    file_name=f"SEC60_Report_{R['city_ar']}_{datetime.now().strftime('%Y%m%d')}.pdf",
    mime="application/pdf",
    use_container_width=True,
)

# Footer
st.markdown("""<hr style="margin:2rem 0;border-color:#e2e8f0;">
<p style="text-align:center;color:#94a3b8;font-size:0.78rem;">
SEC60 ⚡ — منصة الجدوى الشمسية بالذكاء الاصطناعي |
نتائج توضيحية مبنية على بيانات الإشعاع الشمسي وافتراضات مالية شفافة
</p>""", unsafe_allow_html=True)
