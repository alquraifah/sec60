"""
SEC60 PDF Report Service
Generates bilingual (AR/EN) professional PDF reports.
Arabic text: shaped with arabic_reshaper + python-bidi, rendered with Amiri font.
"""

import io, os, uuid, math, urllib.request, logging
from pathlib import Path
from datetime import datetime

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

REPORTS_DIR  = Path(__file__).parent.parent / "reports"
FONTS_DIR    = Path(__file__).parent.parent / "fonts"
AMIRI_PATH   = FONTS_DIR / "Amiri-Regular.ttf"

# ── Colors ────────────────────────────────────────────────────────────────────
NAVY  = colors.HexColor("#0f172a")
LIME  = colors.HexColor("#84cc16")
CYAN  = colors.HexColor("#06b6d4")
WHITE = colors.white
LIGHT = colors.HexColor("#f8fafc")
GRAY  = colors.HexColor("#475569")
LGRAY = colors.HexColor("#e2e8f0")
GREEN = colors.HexColor("#15803d")

# ── Arabic font setup ─────────────────────────────────────────────────────────
_arabic_font_registered = False
ARABIC_FONT = "Helvetica"   # fallback until registration succeeds


def _ensure_arabic_font():
    global _arabic_font_registered, ARABIC_FONT
    if _arabic_font_registered:
        return

    FONTS_DIR.mkdir(exist_ok=True)

    if not AMIRI_PATH.exists() or AMIRI_PATH.stat().st_size < 100_000:
        logger.info("Downloading Amiri Arabic font…")
        for url in [
            "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
            "https://github.com/alif-type/amiri/raw/master/fonts/Amiri-Regular.ttf",
        ]:
            try:
                urllib.request.urlretrieve(url, AMIRI_PATH)
                if AMIRI_PATH.stat().st_size > 100_000:
                    break
            except Exception:
                continue

    if AMIRI_PATH.exists() and AMIRI_PATH.stat().st_size > 100_000:
        try:
            pdfmetrics.registerFont(TTFont("Amiri", str(AMIRI_PATH)))
            ARABIC_FONT = "Amiri"
            _arabic_font_registered = True
            logger.info("Amiri Arabic font registered.")
        except Exception as e:
            logger.warning("Could not register Amiri font: %s", e)
    else:
        logger.warning("Arabic font unavailable — Arabic text may not render correctly.")
    _arabic_font_registered = True   # don't retry on failure


def _ar(text: str) -> str:
    """Shape + bidi-correct Arabic text for ReportLab."""
    if not text:
        return text
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except Exception:
        return text


# ── Chart helpers ─────────────────────────────────────────────────────────────
def _chart_savings(savings_by_year: list) -> io.BytesIO:
    years      = [y["year"] for y in savings_by_year]
    cumulative = [y["cumulative"] for y in savings_by_year]
    capex      = abs(cumulative[0] - savings_by_year[0]["savings"])

    fig, ax = plt.subplots(figsize=(7.2, 3.2), facecolor="white")
    ax.set_facecolor("#f8fafc")
    ax.axhline(0, color="#94a3b8", linewidth=0.8, linestyle="--")
    ax.fill_between(years, cumulative, 0,
                    where=[c >= 0 for c in cumulative], alpha=0.2, color="#84cc16")
    ax.fill_between(years, cumulative, 0,
                    where=[c < 0  for c in cumulative], alpha=0.15, color="#ef4444")
    ax.plot(years, cumulative, color="#84cc16", linewidth=2.5, marker="o",
            markersize=3, label="Net Cumulative Savings (SAR)")
    ax.axhline(-capex, color="#06b6d4", linewidth=1, linestyle=":",
               label="Initial Investment")
    ax.tick_params(colors="#334155", labelsize=7)
    ax.spines[:].set_color("#e2e8f0")
    ax.yaxis.set_major_formatter(
        matplotlib.ticker.FuncFormatter(lambda x, _: f"{int(x/1000)}K"))
    ax.set_xlabel("Year", color="#334155", fontsize=8)
    ax.set_ylabel("SAR", color="#334155", fontsize=8)
    ax.set_title("25-Year Financial Projection", color="#0f172a", fontsize=9, pad=6)
    ax.legend(fontsize=7, facecolor="white", edgecolor="#e2e8f0",
              labelcolor="#334155", loc="upper left")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=130, facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return buf


def _chart_monthly(monthly_kwh: list, months_en: list) -> io.BytesIO:
    fig, ax = plt.subplots(figsize=(7.2, 3.0), facecolor="white")
    ax.set_facecolor("#f8fafc")
    bar_colors = ["#84cc16" if v >= max(monthly_kwh) * 0.92 else "#06b6d4"
                  for v in monthly_kwh]
    ax.bar(months_en, monthly_kwh, color=bar_colors, edgecolor="white", linewidth=0.5)
    ax.tick_params(colors="#334155", labelsize=7)
    ax.spines[:].set_color("#e2e8f0")
    ax.set_title("Monthly Solar Production (kWh)", color="#0f172a", fontsize=9, pad=6)
    ax.set_ylabel("kWh", color="#334155", fontsize=8)
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=130, facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return buf


# ── Main report generator ─────────────────────────────────────────────────────
def generate(analysis: dict, language: str = "ar") -> str:
    """
    Generate a PDF report.
    language: 'ar' (Arabic + RTL) or 'en' (English + LTR)
    Returns the filename (relative to reports/).
    """
    _ensure_arabic_font()
    REPORTS_DIR.mkdir(exist_ok=True)

    report_id = str(uuid.uuid4())[:8].upper()
    filename  = f"SEC60_Report_{report_id}.pdf"
    filepath  = str(REPORTS_DIR / filename)

    is_ar = (language == "ar") and (ARABIC_FONT == "Amiri")
    FONT  = ARABIC_FONT if is_ar else "Helvetica"
    FONTB = (ARABIC_FONT + "" if is_ar else "Helvetica-Bold")
    # Note: Amiri doesn't have a separate Bold variant — use same font
    if is_ar:
        FONTB = ARABIC_FONT
    AR_ALIGN = TA_RIGHT if is_ar else TA_LEFT

    months_en = ["Jan","Feb","Mar","Apr","May","Jun",
                 "Jul","Aug","Sep","Oct","Nov","Dec"]

    fin  = analysis["financial"]
    city = analysis["city"]
    solar= analysis["solar_data"]
    sys_ = analysis["system"]
    ai   = analysis.get("ai_explanation", {})
    asmp = analysis.get("assumptions", {})

    city_label   = _ar(city["name_ar"]) if is_ar else city["name_en"]
    ft_label     = _ar(analysis.get("facility_type_label", "")) if is_ar else analysis.get("facility_type_label", "")
    st_label     = _ar(analysis.get("system_type_label", ""))   if is_ar else analysis.get("system_type_label", "")
    score        = analysis.get("feasibility_score", 0)
    rec_label    = _ar(ai.get("recommendation_ar", "—"))
    summary_text = _ar(ai.get("summary_ar", ""))

    # ── Styles ────────────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2*cm,
    )

    def P(text, size=9, bold=False, align=AR_ALIGN, color=GRAY, indent=0):
        return ParagraphStyle(
            f"p_{id(text)}", fontName=FONTB if bold else FONT,
            fontSize=size, textColor=color, alignment=align,
            leading=size * 1.6, rightIndent=indent,
        )

    TITLE_S  = P("", 20, True, TA_CENTER, NAVY)
    SUB_S    = P("", 10, False, TA_CENTER, GRAY)
    H2_S     = P("", 11, True, AR_ALIGN, NAVY)
    BODY_S   = P("", 9, False, AR_ALIGN, GRAY)
    BOLD_S   = P("", 9, True,  AR_ALIGN, NAVY)
    SMALL_S  = P("", 7.5, False, TA_CENTER, GRAY)
    GREEN_S  = P("", 9, True,  AR_ALIGN, GREEN)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("SEC60 ⚡", TITLE_S))

    subtitle = (
        "تقرير الجدوى الاقتصادية للطاقة الشمسية | Solar Feasibility Report"
        if is_ar else
        "Solar Feasibility Report | Powered by AI"
    )
    story.append(Paragraph(subtitle, SUB_S))
    story.append(HRFlowable(width="100%", thickness=2.5, color=LIME, spaceAfter=8))

    # AI badge
    badge_txt = _ar("نموذج الذكاء الاصطناعي: Random Forest + Solar Data Engine + SEC60 AI Advisor") \
                if is_ar else \
                "AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor"
    story.append(Paragraph(badge_txt, P("", 8.5, True, TA_CENTER, CYAN)))
    story.append(Spacer(1, 0.3*cm))

    # ── Meta table ────────────────────────────────────────────────────────────
    if is_ar:
        meta_data = [
            [_ar("رقم التقرير"), report_id, _ar("التاريخ"), datetime.now().strftime("%Y-%m-%d")],
            [_ar("المدينة"), city_label, _ar("مصدر البيانات"), solar["data_source"].replace("_"," ").title()],
            [_ar("نوع المنشأة"), _ar(ft_label), _ar("نوع النظام"), _ar(st_label)],
        ]
    else:
        meta_data = [
            ["Report ID", report_id, "Date", datetime.now().strftime("%Y-%m-%d")],
            ["City", city_label, "Data Source", solar["data_source"].replace("_"," ").title()],
            ["Facility Type", ft_label, "System Type", st_label],
        ]

    meta_t = Table(meta_data, colWidths=[3.5*cm, 6*cm, 3.5*cm, 5*cm])
    meta_t.setStyle(TableStyle([
        ("FONTNAME",  (0,0),(-1,-1), FONT),
        ("FONTNAME",  (0,0),(0,-1),  FONTB),
        ("FONTNAME",  (2,0),(2,-1),  FONTB),
        ("FONTSIZE",  (0,0),(-1,-1), 8),
        ("TEXTCOLOR", (0,0),(-1,-1), GRAY),
        ("TEXTCOLOR", (0,0),(0,-1),  NAVY),
        ("TEXTCOLOR", (2,0),(2,-1),  NAVY),
        ("ALIGN",     (0,0),(-1,-1), "RIGHT" if is_ar else "LEFT"),
        ("ROWBACKGROUNDS", (0,0),(-1,-1), [LIGHT, WHITE]),
        ("GRID",      (0,0),(-1,-1), 0.3, LGRAY),
        ("TOPPADDING",(0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 0.4*cm))

    # ── Feasibility ───────────────────────────────────────────────────────────
    h2_feasibility = _ar("تقييم الجدوى") if is_ar else "Feasibility Assessment"
    story.append(Paragraph(h2_feasibility, H2_S))

    score_color = LIME if score >= 65 else (colors.orange if score >= 45 else colors.red)
    fs_data = [[
        (_ar("درجة الجدوى") if is_ar else "Feasibility Score"),
        f"{score:.0f} / 100",
        (_ar("التوصية") if is_ar else "Recommendation"),
        rec_label,
    ]]
    fs_t = Table(fs_data, colWidths=[4*cm, 4*cm, 4*cm, 6*cm])
    fs_t.setStyle(TableStyle([
        ("FONTNAME",     (0,0),(-1,-1), FONT),
        ("FONTNAME",     (1,0),(1,0),   FONTB),
        ("FONTSIZE",     (0,0),(-1,-1), 10),
        ("TEXTCOLOR",    (1,0),(1,0),   score_color),
        ("TEXTCOLOR",    (3,0),(3,0),   score_color),
        ("ALIGN",        (0,0),(-1,-1), "RIGHT" if is_ar else "LEFT"),
        ("BACKGROUND",   (0,0),(-1,-1), LIGHT),
        ("GRID",         (0,0),(-1,-1), 0.3, LGRAY),
        ("TOPPADDING",   (0,0),(-1,-1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 8),
    ]))
    story.append(fs_t)
    story.append(Spacer(1, 0.3*cm))

    # ── System specs ──────────────────────────────────────────────────────────
    h2_sys = _ar("مواصفات النظام") if is_ar else "System Specifications"
    story.append(Paragraph(h2_sys, H2_S))

    if is_ar:
        sys_data = [
            [_ar("حجم النظام المقترح"), f"{sys_['recommended_kw']:.1f} kW",
             _ar("الحجم الفعلي"), f"{sys_['actual_kw']:.1f} kW"],
            [_ar("عدد الألواح"), f"{sys_['num_panels']} {_ar('لوح 550 واط')}",
             _ar("الإنتاج اليومي"), f"{fin['daily_production_kwh']:.1f} kWh"],
            [_ar("الإنتاج السنوي"), f"{fin['annual_production_kwh']:,.0f} kWh",
             _ar("الإشعاع الشمسي"), f"{solar['peak_sun_hours']:.1f} PSH/day"],
        ]
    else:
        sys_data = [
            ["Recommended Size", f"{sys_['recommended_kw']:.1f} kW",
             "Actual System Size", f"{sys_['actual_kw']:.1f} kW"],
            ["Number of Panels", f"{sys_['num_panels']} panels (550W)",
             "Daily Production", f"{fin['daily_production_kwh']:.1f} kWh"],
            ["Annual Production", f"{fin['annual_production_kwh']:,.0f} kWh",
             "Solar Irradiance", f"{solar['peak_sun_hours']:.1f} PSH/day"],
        ]

    _table(story, sys_data, is_ar, FONT, FONTB, LGRAY, LIGHT)
    story.append(Spacer(1, 0.3*cm))

    # ── Financial ─────────────────────────────────────────────────────────────
    h2_fin = _ar("التحليل المالي") if is_ar else "Financial Analysis"
    story.append(Paragraph(h2_fin, H2_S))

    if is_ar:
        fin_data = [
            [_ar("تكلفة التركيب"),   f"{fin['installation_cost_sar']:,.0f} SAR",
             _ar("التوفير السنوي"),   f"{fin['annual_savings_sar']:,.0f} SAR"],
            [_ar("التوفير الشهري"),   f"{fin['monthly_savings_sar']:,.0f} SAR/month",
             _ar("فترة الاسترداد"),   f"{fin['payback_years']:.1f} {_ar('سنة')}"],
            [_ar("عائد الاستثمار 25 سنة"), f"{fin['roi_25yr_pct']:.1f}%",
             _ar("تخفيض CO2 سنوياً"), f"{fin['annual_co2_tons']:.2f} {_ar('طن')}"],
        ]
    else:
        fin_data = [
            ["Installation Cost", f"{fin['installation_cost_sar']:,.0f} SAR",
             "Annual Savings",    f"{fin['annual_savings_sar']:,.0f} SAR/year"],
            ["Monthly Savings",   f"{fin['monthly_savings_sar']:,.0f} SAR/month",
             "Payback Period",    f"{fin['payback_years']:.1f} years"],
            ["25-Year ROI",       f"{fin['roi_25yr_pct']:.1f}%",
             "CO2 Reduction",     f"{fin['annual_co2_tons']:.2f} tons/year"],
        ]

    _table(story, fin_data, is_ar, FONT, FONTB, LGRAY, LIGHT, value_color=GREEN)
    story.append(Spacer(1, 0.3*cm))

    # ── Charts ────────────────────────────────────────────────────────────────
    h2_charts = _ar("التوقعات المالية") if is_ar else "Financial Projections (25 Years)"
    story.append(Paragraph(h2_charts, H2_S))
    story.append(RLImage(_chart_savings(fin["savings_by_year"]), width=17*cm, height=7.5*cm))
    story.append(Spacer(1, 0.3*cm))

    h2_mon = _ar("الإنتاج الشهري") if is_ar else "Monthly Solar Production"
    story.append(Paragraph(h2_mon, H2_S))
    story.append(RLImage(_chart_monthly(fin["monthly_production_kwh"], months_en),
                         width=17*cm, height=6.5*cm))
    story.append(Spacer(1, 0.3*cm))

    # ── SEC60 AI Advisor ──────────────────────────────────────────────────────
    h2_ai = _ar("مستشار SEC60 الذكي") if is_ar else "SEC60 AI Advisor"
    story.append(Paragraph(h2_ai, H2_S))

    badge_row = _ar("نموذج الذكاء الاصطناعي: Random Forest + Solar Data Engine + SEC60 AI Advisor") \
                if is_ar else \
                "AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor"
    story.append(Paragraph(badge_row, P("", 8, True, TA_CENTER, CYAN)))
    story.append(Spacer(1, 0.15*cm))

    if summary_text:
        story.append(Paragraph(summary_text, BODY_S))
        story.append(Spacer(1, 0.15*cm))

    reasons = ai.get("reasons_ar", [])
    if reasons:
        lbl = _ar("العوامل الإيجابية:") if is_ar else "Positive Factors:"
        story.append(Paragraph(lbl, BOLD_S))
        for r in reasons[:5]:
            story.append(Paragraph(_ar(r) if is_ar else r, BODY_S))

    risks = ai.get("risks_ar", [])
    if risks:
        story.append(Spacer(1, 0.1*cm))
        lbl = _ar("اعتبارات مهمة:") if is_ar else "Key Considerations:"
        story.append(Paragraph(lbl, BOLD_S))
        for r in risks[:3]:
            story.append(Paragraph(_ar(r) if is_ar else r, BODY_S))

    # ── Next steps ────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.2*cm))
    h2_next = _ar("الخطوات التالية المقترحة") if is_ar else "Recommended Next Steps"
    story.append(Paragraph(h2_next, H2_S))
    for step in ai.get("next_steps_ar", [])[:5]:
        story.append(Paragraph(_ar(step) if is_ar else step, BODY_S))

    # ── Positioning (no disclaimers) ──────────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    pos_txt = _ar(
        "يُقدّم SEC60 تقييمًا ذكيًا للجدوى الشمسية لدعم قرارات الاستثمار في الطاقة بشكل أسرع وأكثر دقة. "
        "تم توليد النتائج باستخدام بيانات الإشعاع الشمسي الحية وتحليل الاستهلاك ونمذجة مالية مدعومة بالذكاء الاصطناعي."
    ) if is_ar else (
        "SEC60 provides an AI-powered solar feasibility assessment to support faster and smarter "
        "energy investment decisions. Results are generated using live solar irradiance data, "
        "consumption analysis, and AI-driven financial modeling."
    )
    story.append(Paragraph(pos_txt, P("", 8.5, False, TA_CENTER, NAVY)))

    # ── Assumptions ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LGRAY, spaceAfter=6))
    h2_asmp = _ar("الافتراضات والمصادر") if is_ar else "Assumptions & Data Sources"
    story.append(Paragraph(h2_asmp, H2_S))

    ml_used = analysis.get("ml_model_used", "formula_fallback")
    asmp_lines = [
        f"Panel: {asmp.get('panel_wattage_w',550)}W | Losses: {asmp.get('system_losses_pct',15)}% | "
        f"Lifetime: {asmp.get('system_lifetime_years',25)}y | Degradation: {asmp.get('degradation_rate_pct_per_year',0.5)}%/y",
        f"CO2 factor: 0.40 kg/kWh (Saudi grid) | Data source: {solar.get('data_source','local')} | "
        f"ML model: {ml_used}",
        f"AI Technologies: Random Forest Regressor + Solar Irradiance Engine + SEC60 AI Advisor",
    ]
    for line in asmp_lines:
        story.append(Paragraph(line, SMALL_S))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3*cm))
    footer = _ar(f"صدر عن منصة SEC60 — {datetime.now().strftime('%Y-%m-%d')} — sec60.ai") \
             if is_ar else \
             f"Generated by SEC60 Platform — {datetime.now().strftime('%Y-%m-%d')} — sec60.ai"
    story.append(Paragraph(footer, P("", 8, False, TA_CENTER, GRAY)))

    doc.build(story)
    return filename


def _table(story, data, is_ar, font, fontb, lgray, light, value_color=None):
    """Render a 4-column data table."""
    t = Table(data, colWidths=[4.5*cm, 5*cm, 4.5*cm, 4*cm])
    style = [
        ("FONTNAME",     (0,0),(-1,-1), font),
        ("FONTNAME",     (0,0),(0,-1),  fontb),
        ("FONTNAME",     (2,0),(2,-1),  fontb),
        ("FONTSIZE",     (0,0),(-1,-1), 8.5),
        ("TEXTCOLOR",    (0,0),(-1,-1), GRAY),
        ("TEXTCOLOR",    (0,0),(0,-1),  NAVY),
        ("TEXTCOLOR",    (2,0),(2,-1),  NAVY),
        ("ALIGN",        (0,0),(-1,-1), "RIGHT" if is_ar else "LEFT"),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[light, WHITE]),
        ("GRID",         (0,0),(-1,-1), 0.3, lgray),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ]
    if value_color:
        style += [
            ("TEXTCOLOR", (1,0),(1,-1), value_color),
            ("TEXTCOLOR", (3,0),(3,-1), value_color),
        ]
    t.setStyle(TableStyle(style))
    story.append(t)
