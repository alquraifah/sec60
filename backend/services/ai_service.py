"""
AI explanation service.
Generates bilingual (Arabic + English) rule-based explanations.
LLM integration point: plug in OpenAI/Groq here when API key is available.
"""


def _score_label(score: float) -> tuple[str, str, str, str]:
    """Return (key, arabic_label, english_label, color)."""
    if score >= 80:
        return "highly_feasible", "موصى به بشدة ✅", "Highly Recommended ✅", "green"
    if score >= 65:
        return "feasible", "موصى به ✅", "Recommended ✅", "lime"
    if score >= 45:
        return "needs_review", "يحتاج مراجعة ⚠️", "Needs Review ⚠️", "yellow"
    return "not_recommended", "غير موصى به ❌", "Not Recommended ❌", "red"


def generate(
    city: dict,
    facility_type: str,
    system_type: str,
    system_size_kw: float,
    feasibility_score: float,
    financial: dict,
    solar_data: dict,
) -> dict:
    """Build bilingual AI explanation for the analysis result."""

    rec_key, rec_ar, rec_en, color = _score_label(feasibility_score)

    psh = solar_data["peak_sun_hours"]
    annual_savings = financial["annual_savings_sar"]
    payback = financial["payback_years"]
    roi = financial["roi_25yr_pct"]
    city_ar = city.get("name_ar", "")
    city_en = city.get("name_en", "")
    monthly_savings = financial["monthly_savings_sar"]

    # ── Arabic content ────────────────────────────────────────────
    reasons_ar = []
    if psh >= 6.2:
        reasons_ar.append(f"☀️ {city_ar} تتمتع بإشعاع شمسي استثنائي ({psh:.1f} ساعة ذروة يومياً)")
    elif psh >= 5.5:
        reasons_ar.append(f"☀️ الإشعاع الشمسي في {city_ar} ممتاز ({psh:.1f} ساعة ذروة يومياً)")
    else:
        reasons_ar.append(f"☀️ الإشعاع الشمسي في {city_ar} جيد ({psh:.1f} ساعة ذروة يومياً)")

    if roi > 200:
        reasons_ar.append(f"💰 عائد الاستثمار مرتفع جداً ({roi:.0f}٪ خلال 25 سنة)")
    elif roi > 100:
        reasons_ar.append(f"💰 عائد الاستثمار جيد ({roi:.0f}٪ خلال 25 سنة)")

    if payback < 7:
        reasons_ar.append(f"⏱ فترة الاسترداد قصيرة ({payback:.1f} سنوات)")
    elif payback < 12:
        reasons_ar.append(f"⏱ فترة الاسترداد معقولة ({payback:.1f} سنوات)")

    if facility_type == "farm":
        reasons_ar.append("🌱 الطاقة الشمسية تحسّن الربحية الزراعية وتقلل تكاليف الضخ")
    if facility_type == "remote":
        reasons_ar.append("🔋 النظام مثالي للمواقع النائية البعيدة عن الشبكة")

    if annual_savings > 30000:
        reasons_ar.append(f"💵 توفير سنوي مرتفع ({annual_savings:,.0f} ريال)")
    elif annual_savings > 5000:
        reasons_ar.append(f"💵 توفير سنوي ملموس ({annual_savings:,.0f} ريال)")

    risks_ar = []
    if payback > 15:
        risks_ar.append(f"⚠️ فترة الاسترداد طويلة نسبياً ({payback:.1f} سنة)")
    if psh < 5.5:
        risks_ar.append("⚠️ الإشعاع الشمسي أقل من المتوسط المثالي")
    if roi < 50:
        risks_ar.append("⚠️ عائد الاستثمار منخفض")
    if system_type == "off_grid":
        risks_ar.append("🔋 بطاريات Off-Grid تحتاج صيانة دورية")
    if not risks_ar:
        risks_ar.append("✅ لا توجد مخاطر جوهرية")

    next_steps_ar = [
        f"📞 التواصل مع مزودي الطاقة الشمسية المعتمدين في {city_ar}",
        "📋 طلب عروض أسعار من 3 شركات على الأقل",
        "⚡ التحقق من متطلبات الربط بالشبكة مع شركة الكهرباء",
        "🏗 فحص الموقع للتأكد من الملاءمة الإنشائية",
        "📄 مراجعة برامج دعم هيئة الطاقة المتجددة (REPDO)",
    ]

    summary_ar = (
        f"بناءً على تحليل البيانات الشمسية والمالية لموقعك في {city_ar}، "
        f"يُنصح بتركيب نظام طاقة شمسية بقدرة {system_size_kw:.1f} كيلوواط. "
        f"يُتوقع أن يوفر النظام ما يقارب {monthly_savings:,.0f} ريال شهرياً "
        f"({annual_savings:,.0f} ريال سنوياً) مع فترة استرداد تقدر بـ {payback:.1f} سنوات."
    )

    # ── English content ───────────────────────────────────────────
    reasons_en = []
    if psh >= 6.2:
        reasons_en.append(f"☀️ {city_en} has exceptional solar irradiance ({psh:.1f} PSH/day)")
    elif psh >= 5.5:
        reasons_en.append(f"☀️ Excellent solar resource in {city_en} ({psh:.1f} PSH/day)")
    else:
        reasons_en.append(f"☀️ Good solar irradiance in {city_en} ({psh:.1f} PSH/day)")

    if roi > 200:
        reasons_en.append(f"💰 Very high ROI ({roi:.0f}% over 25 years)")
    elif roi > 100:
        reasons_en.append(f"💰 Strong ROI ({roi:.0f}% over 25 years)")

    if payback < 7:
        reasons_en.append(f"⏱ Short payback period ({payback:.1f} years)")
    elif payback < 12:
        reasons_en.append(f"⏱ Reasonable payback period ({payback:.1f} years)")

    if facility_type == "farm":
        reasons_en.append("🌱 Solar energy improves farm profitability and reduces pump costs")
    if facility_type == "remote":
        reasons_en.append("🔋 Ideal system for remote off-grid locations")

    if annual_savings > 30000:
        reasons_en.append(f"💵 High annual savings ({annual_savings:,.0f} SAR/year)")
    elif annual_savings > 5000:
        reasons_en.append(f"💵 Significant annual savings ({annual_savings:,.0f} SAR/year)")

    risks_en = []
    if payback > 15:
        risks_en.append(f"⚠️ Payback period is relatively long ({payback:.1f} years)")
    if psh < 5.5:
        risks_en.append("⚠️ Solar irradiance is below optimal average")
    if roi < 50:
        risks_en.append("⚠️ Low return on investment")
    if system_type == "off_grid":
        risks_en.append("🔋 Off-grid batteries require periodic maintenance")
    if not risks_en:
        risks_en.append("✅ No significant risks identified")

    next_steps_en = [
        f"📞 Contact certified solar providers in {city_en}",
        "📋 Request quotes from at least 3 companies for comparison",
        "⚡ Verify grid connection requirements with the utility company",
        "🏗 Conduct a site survey to confirm structural suitability",
        "📄 Inquire about REPDO renewable energy incentive programs",
    ]

    summary_en = (
        f"Based on solar irradiance and financial analysis for your site in {city_en}, "
        f"a {system_size_kw:.1f} kW solar system is recommended. "
        f"Expected savings: {monthly_savings:,.0f} SAR/month "
        f"({annual_savings:,.0f} SAR/year) with a payback period of {payback:.1f} years."
    )

    return {
        "recommendation_key": rec_key,
        "recommendation_ar": rec_ar,
        "recommendation_en": rec_en,
        "color": color,
        "summary_ar": summary_ar,
        "summary_en": summary_en,
        "reasons_ar": reasons_ar,
        "reasons_en": reasons_en,
        "risks_ar": risks_ar,
        "risks_en": risks_en,
        "next_steps_ar": next_steps_ar,
        "next_steps_en": next_steps_en,
    }
