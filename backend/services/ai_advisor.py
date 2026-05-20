"""
SEC60 AI Advisor
Generates structured, bilingual feasibility explanations.
Rule-based engine — plug in OpenAI/Groq/Llama at the marked integration point.
No weak disclaimers. Strong investment-support positioning only.
"""

import os

# ── LLM integration point ─────────────────────────────────────────────────────
# Uncomment and add keys to backend/.env to enable LLM explanations:
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# GROQ_API_KEY   = os.getenv("GROQ_API_KEY")
# ─────────────────────────────────────────────────────────────────────────────

STRONG_POSITIONING = {
    "ar": (
        "يُقدّم SEC60 تقييمًا ذكيًا للجدوى الشمسية لدعم قرارات الاستثمار "
        "في الطاقة بشكل أسرع وأكثر دقة."
    ),
    "en": (
        "SEC60 provides an AI-powered solar feasibility assessment to support "
        "faster and smarter energy investment decisions."
    ),
}


def _label(score: float, lang: str) -> tuple[str, str, str]:
    """Returns (key, label, color) based on feasibility score."""
    if score >= 80:
        return ("highly_feasible",
                "مجدي جدًا ✅" if lang == "ar" else "Highly Feasible ✅", "green")
    if score >= 65:
        return ("feasible",
                "مجدي ✅" if lang == "ar" else "Feasible ✅", "lime")
    if score >= 45:
        return ("moderate",
                "متوسط الجدوى ⚡" if lang == "ar" else "Moderate Feasibility ⚡", "yellow")
    if score >= 20:
        return ("needs_optimization",
                "يحتاج تحسين ⚙️" if lang == "ar" else "Needs Optimization ⚙️", "orange")
    return ("not_recommended",
            "غير مُوصى به ❌" if lang == "ar" else "Not Recommended ❌", "red")


def advise(
    city: dict,
    facility_type: str,
    system_type: str,
    system_size_kw: float,
    feasibility_score: float,
    financial: dict,
    solar_data: dict,
    lang: str = "ar",
) -> dict:
    """
    Build a structured AI Advisor explanation.
    lang: 'ar' (Arabic, default) or 'en' (English)
    """
    rec_key, rec_label, color = _label(feasibility_score, lang)

    psh            = solar_data["peak_sun_hours"]
    annual_sav     = financial["annual_savings_sar"]
    monthly_sav    = financial["monthly_savings_sar"]
    payback        = financial["payback_years"]
    roi            = financial["roi_25yr_pct"]
    capex          = financial["installation_cost_sar"]
    city_ar        = city.get("name_ar", city.get("name_en", ""))
    city_en        = city.get("name_en", "")
    city_name      = city_ar if lang == "ar" else city_en

    reasons, risks, next_steps = [], [], []

    if lang == "ar":
        # ── Positive factors ─────────────────────────────────────────────
        if psh >= 6.2:
            reasons.append(f"☀️ {city_ar} تتمتع بإشعاع شمسي استثنائي ({psh:.1f} ساعة ذروة يومياً)")
        elif psh >= 5.5:
            reasons.append(f"☀️ الإشعاع الشمسي في {city_ar} ممتاز ({psh:.1f} ساعة ذروة يومياً)")
        else:
            reasons.append(f"☀️ الإشعاع الشمسي في {city_ar} جيد ({psh:.1f} ساعة ذروة يومياً)")

        if roi > 200:
            reasons.append(f"💰 عائد الاستثمار مرتفع جداً ({roi:.0f}٪ خلال 25 سنة)")
        elif roi > 100:
            reasons.append(f"💰 عائد الاستثمار جيد ({roi:.0f}٪ خلال 25 سنة)")

        if payback < 7:
            reasons.append(f"⏱ فترة استرداد قصيرة جداً ({payback:.1f} سنوات)")
        elif payback < 12:
            reasons.append(f"⏱ فترة استرداد معقولة ({payback:.1f} سنوات)")

        if annual_sav > 30000:
            reasons.append(f"💵 توفير سنوي مرتفع ({annual_sav:,.0f} ريال)")
        elif annual_sav > 5000:
            reasons.append(f"💵 توفير سنوي ملموس ({annual_sav:,.0f} ريال — {monthly_sav:,.0f} ريال/شهر)")

        if facility_type == "farm":
            reasons.append("🌱 مزارع الطاقة الشمسية تُعزز الربحية الزراعية وتُخفض تكاليف الضخ")
        if facility_type == "remote":
            reasons.append("🔋 النظام المستقل مثالي للمواقع البعيدة عن شبكة الكهرباء")

        # ── Risks ────────────────────────────────────────────────────────
        if payback > 15:
            risks.append(f"⚠️ فترة الاسترداد طويلة نسبياً ({payback:.1f} سنة) — تأثير التعرفة المنخفضة")
        if psh < 5.5:
            risks.append(f"⚠️ الإشعاع الشمسي أدنى من المتوسط الأمثل — ستقل الإنتاجية قليلاً")
        if system_type == "off_grid":
            risks.append("🔋 بطاريات Off-Grid تحتاج صيانة دورية وتجديد بعد 10-12 سنة")
        if not risks:
            risks.append("✅ لا توجد مخاطر جوهرية — التحليل يُشير إلى جدوى اقتصادية إيجابية")

        # ── Next steps ───────────────────────────────────────────────────
        next_steps = [
            f"📞 التواصل مع مزودي الطاقة الشمسية المعتمدين في {city_ar}",
            "📋 طلب عروض أسعار مفصلة من 3 شركات على الأقل وإجراء مقارنة كاملة",
            "⚡ التحقق من متطلبات الربط بالشبكة مع شركة الكهرباء (SEC/SWCC)",
            "🏗 إجراء فحص ميداني للموقع للتحقق من الملاءمة الإنشائية",
            "📄 الاستفسار عن برامج دعم الطاقة المتجددة من هيئة REPDO",
        ]

        summary = (
            f"بناءً على تحليل SEC60 لبيانات الإشعاع الشمسي والاستهلاك لموقعك في {city_ar}، "
            f"يُنصح بتركيب نظام طاقة شمسية بقدرة {system_size_kw:.1f} كيلوواط. "
            f"يُتوقع توفير {monthly_sav:,.0f} ريال شهرياً ({annual_sav:,.0f} ريال سنوياً) "
            f"مع فترة استرداد تُقدَّر بـ {payback:.1f} سنوات."
        )

    else:  # English
        if psh >= 6.2:
            reasons.append(f"☀️ {city_en} has exceptional solar irradiance ({psh:.1f} PSH/day)")
        elif psh >= 5.5:
            reasons.append(f"☀️ Excellent solar resource in {city_en} ({psh:.1f} PSH/day)")
        else:
            reasons.append(f"☀️ Good solar irradiance in {city_en} ({psh:.1f} PSH/day)")

        if roi > 200:
            reasons.append(f"💰 Very high ROI ({roi:.0f}% over 25 years)")
        elif roi > 100:
            reasons.append(f"💰 Strong ROI ({roi:.0f}% over 25 years)")

        if payback < 7:
            reasons.append(f"⏱ Very short payback period ({payback:.1f} years)")
        elif payback < 12:
            reasons.append(f"⏱ Reasonable payback period ({payback:.1f} years)")

        if annual_sav > 5000:
            reasons.append(f"💵 Significant annual savings ({annual_sav:,.0f} SAR/year)")

        if payback > 15:
            risks.append(f"⚠️ Payback period is relatively long ({payback:.1f} years)")
        if psh < 5.5:
            risks.append("⚠️ Solar irradiance is below optimal — slightly lower productivity")
        if system_type == "off_grid":
            risks.append("🔋 Off-grid batteries require periodic maintenance and replacement after 10-12 years")
        if not risks:
            risks.append("✅ No significant risks — analysis indicates positive economic viability")

        next_steps = [
            f"📞 Contact certified solar providers in {city_en}",
            "📋 Request detailed quotes from at least 3 companies for comparison",
            "⚡ Verify grid connection requirements with the utility company",
            "🏗 Conduct a site survey to confirm structural suitability",
            "📄 Inquire about renewable energy incentive programs from REPDO",
        ]

        summary = (
            f"Based on SEC60's analysis of solar irradiance and consumption data for your site in {city_en}, "
            f"a {system_size_kw:.1f} kW solar system is recommended. "
            f"Expected savings: {monthly_sav:,.0f} SAR/month ({annual_sav:,.0f} SAR/year) "
            f"with an estimated payback period of {payback:.1f} years."
        )

    return {
        "recommendation_key": rec_key,
        "recommendation_ar":  rec_label,
        "recommendation_en":  rec_label,
        "color":              color,
        "summary_ar":         summary,
        "reasons_ar":         reasons,
        "risks_ar":           risks,
        "next_steps_ar":      next_steps,
        "positioning":        STRONG_POSITIONING[lang],
        "ai_badge":           "AI Model: Random Forest + Solar Data Engine + SEC60 AI Advisor",
    }
