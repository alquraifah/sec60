"""
SEC60 PDF Report Service
Generates bilingual (AR/EN) professional PDF reports.
Arabic text: shaped with arabic_reshaper + python-bidi, rendered with Amiri font.
English text: rendered with Helvetica.
"""

import io, uuid, logging, urllib.request
from pathlib import Path
from datetime import datetime

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).parent.parent / "reports"
FONTS_DIR = Path(__file__).parent.parent / "fonts"
AMIRI_PATH = FONTS_DIR / "Amiri-Regular.ttf"

NAVY = colors.HexColor("#0f172a")
TEAL = colors.HexColor("#14b8a6")
CYAN = colors.HexColor("#06b6d4")
WHITE = colors.white
LIGHT = colors.HexColor("#f8fafc")
GRAY = colors.HexColor("#475569")
LGRAY = colors.HexColor("#e2e8f0")
GREEN = colors.HexColor("#15803d")

_arabic_font_ready = False
ARABIC_FONT = "Helvetica"


def _ensure_arabic_font():
    global _arabic_font_ready, ARABIC_FONT
    if _arabic_font_ready:
        return

    FONTS_DIR.mkdir(exist_ok=True)

    if not AMIRI_PATH.exists() or AMIRI_PATH.stat().st_size < 100_000:
        logger.info("Downloading Amiri Arabic font...")
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
            logger.info("Amiri Arabic font registered.")
        except Exception as e:
            logger.warning("Could not register Amiri font: %s", e)

    _arabic_font_ready = True


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


def _chart_savings(savings_by_year: list) -> io.BytesIO:
    years = [y["year"] for y in savings_by_year]
    cumulative = [y["cumulative"] for y in savings_by_year]
    capex = abs(cumulative[0] - savings_by_year[0]["savings"])

    fig, ax = plt.subplots(figsize=(7.2, 3.2), facecolor="white")
    ax.set_facecolor("#f8fafc")
    ax.axhline(0, color="#94a3b8", linewidth=0.8, linestyle="--")
    ax.fill_between(years, cumulative, 0,
                    where=[c >= 0 for c in cumulative], alpha=0.2, color="#14b8a6")
    ax.fill_between(years, cumulative, 0,
                    where=[c < 0 for c in cumulative], alpha=0.15, color="#ef4444")
    ax.plot(years, cumulative, color="#14b8a6", linewidth=2.5, marker="o",
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
    bar_colors = ["#14b8a6" if v >= max(monthly_kwh) * 0.92 else "#06b6d4"
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


def _make_table(story, data, font, fontb, is_ar):
    t = Table(data, colWidths=[4.5 * cm, 5 * cm, 4.5 * cm, 4 * cm])
    align = "RIGHT" if is_ar else "LEFT"
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTNAME", (0, 0), (0, -1), fontb),
        ("FONTNAME", (2, 0), (2, -1), fontb),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), GRAY),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), NAVY),
        ("TEXTCOLOR", (1, 0), (1, -1), GREEN),
        ("TEXTCOLOR", (3, 0), (3, -1), GREEN),
        ("ALIGN", (0, 0), (-1, -1), align),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT, WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.3, LGRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)


def generate(analysis: dict, language: str = "en") -> str:
    """Generate a PDF report. Returns filename relative to reports/."""
    _ensure_arabic_font()
    REPORTS_DIR.mkdir(exist_ok=True)

    report_id = str(uuid.uuid4())[:8].upper()
    filename = f"SEC60_Report_{report_id}.pdf"
    filepath = str(REPORTS_DIR / filename)

    is_ar = language == "ar" and ARABIC_FONT == "Amiri"

    if is_ar:
        FONT = ARABIC_FONT
        FONTB = ARABIC_FONT
        ALIGN = TA_RIGHT
    else:
        FONT = "Helvetica"
        FONTB = "Helvetica-Bold"
        ALIGN = TA_LEFT

    months_en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    fin = analysis["financial"]
    city = analysis["city"]
    solar = analysis["solar_data"]
    sys_ = analysis["system"]
    ai = analysis.get("ai_explanation", {})
    asmp = analysis.get("assumptions", {})

    # Pick labels based on language
    if is_ar:
        city_label = _ar(city.get("name_ar", city.get("name_en", "")))
        ft_label = _ar(analysis.get("facility_type_label", ""))
        st_label = _ar(analysis.get("system_type_label", ""))
        rec_label = _ar(ai.get("recommendation_ar", ""))
        summary = _ar(ai.get("summary_ar", ""))
        reasons = ai.get("reasons_ar", [])
        risks = ai.get("risks_ar", [])
        next_steps = ai.get("next_steps_ar", [])
    else:
        city_label = city.get("name_en", city.get("name_ar", ""))
        ft_label = analysis.get("facility_type_label_en", analysis.get("facility_type", ""))
        st_label = analysis.get("system_type_label_en", analysis.get("system_type", ""))
        rec_label = ai.get("recommendation_en", ai.get("recommendation_ar", ""))
        summary = ai.get("summary_en", ai.get("summary_ar", ""))
        reasons = ai.get("reasons_en", ai.get("reasons_ar", []))
        risks = ai.get("risks_en", ai.get("risks_ar", []))
        next_steps = ai.get("next_steps_en", ai.get("next_steps_ar", []))

    score = analysis.get("feasibility_score", 0)

    # ── Styles ────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    def S(size=9, bold=False, align=ALIGN, color=GRAY):
        return ParagraphStyle(
            f"s_{id(size)}_{bold}_{align}",
            fontName=FONTB if bold else FONT,
            fontSize=size, textColor=color, alignment=align,
            leading=size * 1.6,
        )

    TITLE_S = S(20, True, TA_CENTER, NAVY)
    SUB_S = S(10, False, TA_CENTER, GRAY)
    H2_S = S(11, True, ALIGN, NAVY)
    BODY_S = S(9, False, ALIGN, GRAY)
    BOLD_S = S(9, True, ALIGN, NAVY)
    SMALL_S = S(7.5, False, TA_CENTER, GRAY)
    GREEN_S = S(9, True, ALIGN, GREEN)

    story = []

    # ── Header ────────────────────────────────────────────────────
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("SEC60", TITLE_S))

    if is_ar:
        subtitle = _ar("تقرير الجدوى الاقتصادية للطاقة الشمسية")
    else:
        subtitle = "Solar Feasibility Report | Powered by AI"
    story.append(Paragraph(subtitle, SUB_S))
    story.append(HRFlowable(width="100%", thickness=2.5, color=TEAL, spaceAfter=8))

    badge = "AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor"
    story.append(Paragraph(badge, S(8.5, True, TA_CENTER, CYAN)))
    story.append(Spacer(1, 0.3 * cm))

    # ── Meta table ────────────────────────────────────────────────
    if is_ar:
        meta = [
            [_ar("رقم التقرير"), report_id, _ar("التاريخ"), datetime.now().strftime("%Y-%m-%d")],
            [_ar("المدينة"), city_label, _ar("مصدر البيانات"), solar["data_source"].replace("_", " ").title()],
            [_ar("نوع المنشأة"), ft_label, _ar("نوع النظام"), st_label],
        ]
    else:
        meta = [
            ["Report ID", report_id, "Date", datetime.now().strftime("%Y-%m-%d")],
            ["City", city_label, "Data Source", solar["data_source"].replace("_", " ").title()],
            ["Facility Type", ft_label, "System Type", st_label],
        ]

    meta_t = Table(meta, colWidths=[3.5 * cm, 6 * cm, 3.5 * cm, 5 * cm])
    meta_align = "RIGHT" if is_ar else "LEFT"
    meta_t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTNAME", (0, 0), (0, -1), FONTB),
        ("FONTNAME", (2, 0), (2, -1), FONTB),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (0, 0), (-1, -1), GRAY),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), NAVY),
        ("ALIGN", (0, 0), (-1, -1), meta_align),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT, WHITE]),
        ("GRID", (0, 0), (-1, -1), 0.3, LGRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_t)
    story.append(Spacer(1, 0.4 * cm))

    # ── Feasibility ───────────────────────────────────────────────
    h2 = _ar("تقييم الجدوى") if is_ar else "Feasibility Assessment"
    story.append(Paragraph(h2, H2_S))

    score_color = TEAL if score >= 65 else (colors.orange if score >= 45 else colors.red)

    if is_ar:
        fs_data = [[_ar("درجة الجدوى"), f"{score:.0f} / 100", _ar("التوصية"), rec_label]]
    else:
        fs_data = [["Feasibility Score", f"{score:.0f} / 100", "Recommendation", rec_label]]

    fs_t = Table(fs_data, colWidths=[4 * cm, 4 * cm, 4 * cm, 6 * cm])
    fs_t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTNAME", (1, 0), (1, 0), FONTB),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (1, 0), (1, 0), score_color),
        ("TEXTCOLOR", (3, 0), (3, 0), score_color),
        ("ALIGN", (0, 0), (-1, -1), meta_align),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.3, LGRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(fs_t)
    story.append(Spacer(1, 0.3 * cm))

    # ── System specs ──────────────────────────────────────────────
    if is_ar:
        story.append(Paragraph(_ar("مواصفات النظام"), H2_S))
        sys_data = [
            [_ar("حجم النظام"), f"{sys_['recommended_kw']:.1f} kW", _ar("الحجم الفعلي"), f"{sys_['actual_kw']:.1f} kW"],
            [_ar("عدد الألواح"), f"{sys_['num_panels']}", _ar("الإنتاج اليومي"), f"{fin['daily_production_kwh']:.1f} kWh"],
            [_ar("الإنتاج السنوي"), f"{fin['annual_production_kwh']:,.0f} kWh", _ar("الإشعاع الشمسي"), f"{solar['peak_sun_hours']:.1f} PSH/day"],
        ]
    else:
        story.append(Paragraph("System Specifications", H2_S))
        sys_data = [
            ["Recommended Size", f"{sys_['recommended_kw']:.1f} kW", "Actual System Size", f"{sys_['actual_kw']:.1f} kW"],
            ["Number of Panels", f"{sys_['num_panels']} panels (550W)", "Daily Production", f"{fin['daily_production_kwh']:.1f} kWh"],
            ["Annual Production", f"{fin['annual_production_kwh']:,.0f} kWh", "Solar Irradiance", f"{solar['peak_sun_hours']:.1f} PSH/day"],
        ]
    _make_table(story, sys_data, FONT, FONTB, is_ar)
    story.append(Spacer(1, 0.3 * cm))

    # ── Financial ─────────────────────────────────────────────────
    if is_ar:
        story.append(Paragraph(_ar("التحليل المالي"), H2_S))
        fin_data = [
            [_ar("تكلفة التركيب"), f"{fin['installation_cost_sar']:,.0f} SAR", _ar("التوفير السنوي"), f"{fin['annual_savings_sar']:,.0f} SAR"],
            [_ar("التوفير الشهري"), f"{fin['monthly_savings_sar']:,.0f} SAR", _ar("فترة الاسترداد"), f"{fin['payback_years']:.1f} years"],
            [_ar("عائد الاستثمار"), f"{fin['roi_25yr_pct']:.1f}%", _ar("تخفيض CO2"), f"{fin['annual_co2_tons']:.2f} tons/yr"],
        ]
    else:
        story.append(Paragraph("Financial Analysis", H2_S))
        fin_data = [
            ["Installation Cost", f"{fin['installation_cost_sar']:,.0f} SAR", "Annual Savings", f"{fin['annual_savings_sar']:,.0f} SAR/year"],
            ["Monthly Savings", f"{fin['monthly_savings_sar']:,.0f} SAR/month", "Payback Period", f"{fin['payback_years']:.1f} years"],
            ["25-Year ROI", f"{fin['roi_25yr_pct']:.1f}%", "CO2 Reduction", f"{fin['annual_co2_tons']:.2f} tons/year"],
        ]
    _make_table(story, fin_data, FONT, FONTB, is_ar)
    story.append(Spacer(1, 0.3 * cm))

    # ── Charts ────────────────────────────────────────────────────
    story.append(Paragraph("Financial Projections (25 Years)" if not is_ar else _ar("التوقعات المالية"), H2_S))
    story.append(RLImage(_chart_savings(fin["savings_by_year"]), width=17 * cm, height=7.5 * cm))
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("Monthly Solar Production" if not is_ar else _ar("الإنتاج الشهري"), H2_S))
    story.append(RLImage(_chart_monthly(fin["monthly_production_kwh"], months_en), width=17 * cm, height=6.5 * cm))
    story.append(Spacer(1, 0.3 * cm))

    # ── AI Advisor ────────────────────────────────────────────────
    story.append(Paragraph("SEC60 AI Advisor" if not is_ar else _ar("مستشار SEC60 الذكي"), H2_S))
    story.append(Paragraph(badge, S(8, True, TA_CENTER, CYAN)))
    story.append(Spacer(1, 0.15 * cm))

    if summary:
        if is_ar:
            story.append(Paragraph(_ar(summary), BODY_S))
        else:
            story.append(Paragraph(summary, BODY_S))
        story.append(Spacer(1, 0.15 * cm))

    if reasons:
        lbl = _ar("العوامل الإيجابية:") if is_ar else "Positive Factors:"
        story.append(Paragraph(lbl, BOLD_S))
        for r in reasons[:5]:
            story.append(Paragraph(_ar(r) if is_ar else r, BODY_S))

    if risks:
        story.append(Spacer(1, 0.1 * cm))
        lbl = _ar("اعتبارات مهمة:") if is_ar else "Key Considerations:"
        story.append(Paragraph(lbl, BOLD_S))
        for r in risks[:3]:
            story.append(Paragraph(_ar(r) if is_ar else r, BODY_S))

    # ── Next steps ────────────────────────────────────────────────
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Recommended Next Steps" if not is_ar else _ar("الخطوات التالية"), H2_S))
    for step in next_steps[:5]:
        story.append(Paragraph(_ar(step) if is_ar else step, BODY_S))

    # ── Positioning ───────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * cm))
    pos = (
        "SEC60 provides an AI-powered solar feasibility assessment to support faster and smarter "
        "energy investment decisions. Results are generated using live solar irradiance data, "
        "consumption analysis, and AI-driven financial modeling."
    )
    story.append(Paragraph(pos, S(8.5, False, TA_CENTER, NAVY)))

    # ── Assumptions ───────────────────────────────────────────────
    story.append(Spacer(1, 0.4 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LGRAY, spaceAfter=6))
    story.append(Paragraph("Assumptions & Data Sources", H2_S))

    ml_used = analysis.get("ml_model_used", "formula_fallback")
    for line in [
        f"Panel: {asmp.get('panel_wattage_w', 550)}W | Losses: {asmp.get('system_losses_pct', 15)}% | "
        f"Lifetime: {asmp.get('system_lifetime_years', 25)}y | Degradation: {asmp.get('degradation_rate_pct_per_year', 0.5)}%/y",
        f"CO2 factor: 0.40 kg/kWh (Saudi grid) | Data source: {solar.get('data_source', 'local')} | ML model: {ml_used}",
        "AI Technologies: Random Forest Regressor + Solar Irradiance Engine + SEC60 AI Advisor",
    ]:
        story.append(Paragraph(line, SMALL_S))

    # ── Footer ────────────────────────────────────────────────────
    story.append(Spacer(1, 0.3 * cm))
    footer = f"Generated by SEC60 Platform - {datetime.now().strftime('%Y-%m-%d')} - sec60.ai"
    story.append(Paragraph(footer, S(8, False, TA_CENTER, GRAY)))

    doc.build(story)
    return filename
