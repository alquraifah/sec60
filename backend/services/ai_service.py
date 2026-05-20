"""
AI explanation service.
Generates Arabic rule-based explanations; plug in OpenAI/Groq here when API key is available.
"""

import os

# ── OpenAI integration point ──────────────────────────────────────────────────
# Uncomment and add your key to .env to enable LLM-powered explanations.
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
# ─────────────────────────────────────────────────────────────────────────────


def _score_label(score: float) -> tuple[str, str, str]:
    """Return (recommendation_key, arabic_label, color)."""
    if score >= 80:
        return "highly_feasible", "مجدي جداً ✅", "green"
    if score >= 65:
        return "feasible", "مجدي ✅", "lime"
    if score >= 45:
        return "needs_review", "يحتاج مراجعة ⚠️", "yellow"
    return "not_recommended", "غير مجدي ❌", "red"


def generate(
    city: dict,
    facility_type: str,
    system_type: str,
    system_size_kw: float,
    feasibility_score: float,
    financial: dict,
    solar_data: dict,
) -> dict:
    """Build a rule-based Arabic explanation for the analysis result."""

    rec_key, rec_ar, color = _score_label(feasibility_score)

    psh = solar_data["peak_sun_hours"]
    annual_savings = financial["annual_savings_sar"]
    payback = financial["payback_years"]
    roi = financial["roi_25yr_pct"]
    capex = financial["installation_cost_sar"]
    city_ar = city["name_ar"]
    monthly_savings = financial["monthly_savings_sar"]

    # ── Reasons (positive factors) ────────────────────────────────
    reasons = []

    if psh >= 6.2:
        reasons.append(f"☀️ {city_ar} تتمتع بإشعاع شمسي استثنائي ({psh:.1f} ساعة ذروة يومياً)")
    elif psh >= 5.8:
        reasons.append(f"☀️ {city_ar} لديها إشعاع شمسي ممتاز ({psh:.1f} ساعة ذروة يومياً)")
    elif psh >= 5.0:
        reasons.append(f"☀️ الإشعاع الشمسي في {city_ar} جيد ({psh:.1f} ساعة ذروة يومياً)")

    if roi > 200:
        reasons.append(f"💰 عائد الاستثمار مرتفع جداً ({roi:.0f}٪ خلال 25 سنة)")
    elif roi > 100:
        reasons.append(f"💰 عائد الاستثمار جيد ({roi:.0f}٪ خلال 25 سنة)")

    if payback < 6:
        reasons.append(f"⏱ فترة الاسترداد قصيرة جداً ({payback:.1f} سنوات فقط)")
    elif payback < 10:
        reasons.append(f"⏱ فترة الاسترداد معقولة ({payback:.1f} سنوات)")

    if facility_type == "remote":
        reasons.append("🔋 النظام المستقل أو الهجين مثالي للمواقع النائية البعيدة عن الشبكة")

    if facility_type == "farm":
        reasons.append("🌱 مزارع الطاقة الشمسية تحسّن الربحية الزراعية وتقلل تكاليف الضخ")

    if annual_savings > 50000:
        reasons.append(f"💵 التوفير المتوقع مرتفع ({annual_savings:,.0f} ريال سنوياً)")
    elif annual_savings > 10000:
        reasons.append(f"💵 توفير سنوي ملموس ({annual_savings:,.0f} ريال)")

    # ── Risks ─────────────────────────────────────────────────────
    risks = []

    if psh < 5.5:
        risks.append(f"⚠️ الإشعاع الشمسي في {city_ar} أقل من المتوسط المثالي")

    if payback > 15:
        risks.append(f"⚠️ فترة الاسترداد طويلة نسبياً ({payback:.1f} سنة)")

    if roi < 50:
        risks.append("⚠️ عائد الاستثمار منخفض - ينصح بمراجعة حجم النظام والبدائل")

    if system_type == "off_grid":
        risks.append("🔋 أنظمة البطاريات تحتاج صيانة دورية وإعادة تكلفة بعد 10-15 سنة")

    if not risks:
        risks.append("✅ لا توجد مخاطر جوهرية - النتائج إيجابية بشكل عام")

    # ── Next steps ────────────────────────────────────────────────
    next_steps = [
        f"📞 التواصل مع مزودي الطاقة الشمسية المعتمدين في {city_ar}",
        "📋 طلب عروض أسعار مفصلة من 3 شركات على الأقل للمقارنة",
        "⚡ التحقق من متطلبات الربط بالشبكة مع شركة الكهرباء (SEC/SWCC)",
        "🏠 فحص الموقع والسقف للتأكد من الملاءمة الإنشائية",
        "📄 مراجعة إمكانية الاستفادة من برامج دعم هيئة الطاقة المتجددة (REPDO)",
    ]

    # ── Summary ───────────────────────────────────────────────────
    summary = (
        f"بناءً على تحليل البيانات الشمسية والمالية لموقعك في {city_ar}، "
        f"يُنصح بتركيب نظام طاقة شمسية بقدرة {system_size_kw:.1f} كيلوواط. "
        f"يُتوقع أن يوفر النظام ما يقارب {monthly_savings:,.0f} ريال شهرياً "
        f"({annual_savings:,.0f} ريال سنوياً) مع فترة استرداد تقدر بـ {payback:.1f} سنوات."
    )

    return {
        "recommendation_key": rec_key,
        "recommendation_ar": rec_ar,
        "color": color,
        "summary_ar": summary,
        "reasons_ar": reasons if reasons else ["📊 النتائج تشير إلى جدوى اقتصادية مقبولة"],
        "risks_ar": risks,
        "next_steps_ar": next_steps,
    }
