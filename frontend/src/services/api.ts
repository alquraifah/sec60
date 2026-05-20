/**
 * SEC60 API service layer.
 *
 * All calls use apiRequest() / apiUpload() from src/lib/api.ts so that
 * the backend URL is configured in exactly one place (frontend/.env).
 */
import { apiRequest, apiUpload, checkBackendHealth, API_BASE_URL } from '../lib/api';
import type { AnalyzeRequest, AnalysisResult, CityInfo, OCRResult } from '../types';

export { API_BASE_URL, checkBackendHealth };

// ── API methods ───────────────────────────────────────────────────────────────

export const api = {
  /** GET /cities — list of supported Saudi cities */
  getCities: (): Promise<CityInfo[]> =>
    apiRequest<{ cities: CityInfo[] }>('/cities').then(d => d.cities),

  /** POST /analyze — full solar feasibility analysis */
  analyze: (req: AnalyzeRequest): Promise<AnalysisResult> =>
    apiRequest<AnalysisResult>('/analyze', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  /** POST /ocr-bill — extract consumption from uploaded bill image/PDF */
  uploadBill: async (file: File): Promise<OCRResult> => {
    const form = new FormData();
    form.append('file', file);
    return apiUpload<OCRResult>('/ocr-bill', form);
  },

  /** POST /generate-report — generate PDF and return the download URL */
  generateReport: async (analysis: AnalysisResult): Promise<string> => {
    const data = await apiRequest<{ report_url: string; success: boolean }>(
      '/generate-report',
      { method: 'POST', body: JSON.stringify({ analysis }) }
    );
    return `${API_BASE_URL}${data.report_url}`;
  },

  /** GET /health — returns true if backend is reachable */
  healthCheck: checkBackendHealth,
};

// ── Demo / offline fallback data ──────────────────────────────────────────────
export const DEMO_RESULT: AnalysisResult = {
  city: {
    id: 'riyadh',
    name_ar: 'الرياض',
    name_en: 'Riyadh',
    peak_sun_hours: 6.2,
    region_ar: 'منطقة الرياض',
  },
  solar_data: { peak_sun_hours: 6.2, avg_temp_c: 26.5, data_source: 'demo_mode' },
  system: { recommended_kw: 15.0, actual_kw: 15.4, num_panels: 28 },
  financial: {
    num_panels: 28,
    actual_system_kw: 15.4,
    daily_production_kwh: 81.0,
    monthly_production_kwh: [2440, 2320, 2730, 2880, 2970, 2880, 2800, 2830, 2880, 2820, 2580, 2440],
    annual_production_kwh: 32570,
    tariff_sar_kwh: 0.18,
    annual_savings_sar: 5863,
    monthly_savings_sar: 489,
    installation_cost_sar: 53900,
    payback_years: 9.2,
    roi_25yr_pct: 118.5,
    savings_by_year: Array.from({ length: 25 }, (_, i) => ({
      year: i + 1,
      savings: Math.round(5863 * Math.pow(0.995, i) - 808),
      cumulative: Math.round(
        -53900 +
          Array.from({ length: i + 1 }, (_, j) =>
            5863 * Math.pow(0.995, j) - 808
          ).reduce((a, b) => a + b, 0)
      ),
    })),
    annual_co2_tons: 13.03,
    lifetime_co2_tons: 325.7,
    trees_equivalent: 586,
  },
  feasibility_score: 74,
  ml_model_used: 'demo_mode',
  ai_explanation: {
    recommendation_key: 'feasible',
    recommendation_ar: 'مجدي ✅',
    color: 'lime',
    summary_ar:
      'بناءً على تحليل البيانات الشمسية والمالية لموقعك في الرياض، يُنصح بتركيب نظام طاقة شمسية بقدرة 15.4 كيلوواط. يُتوقع أن يوفر النظام ما يقارب 489 ريال شهرياً (5,863 ريال سنوياً) مع فترة استرداد تقدر بـ 9.2 سنوات.',
    reasons_ar: [
      '☀️ الرياض تتمتع بإشعاع شمسي ممتاز (6.2 ساعة ذروة يومياً)',
      '💰 عائد الاستثمار جيد (118٪ خلال 25 سنة)',
      '⏱ فترة الاسترداد معقولة (9.2 سنوات)',
    ],
    risks_ar: ['✅ لا توجد مخاطر جوهرية — النتائج إيجابية بشكل عام'],
    next_steps_ar: [
      '📞 التواصل مع مزودي الطاقة الشمسية المعتمدين في الرياض',
      '📋 طلب عروض أسعار مفصلة من 3 شركات على الأقل',
      '⚡ التحقق من متطلبات الربط بالشبكة مع شركة الكهرباء',
    ],
  },
  facility_type: 'residential',
  facility_type_label: 'سكني',
  system_type: 'grid_tied',
  system_type_label: 'مرتبط بالشبكة',
  monthly_kwh_input: 1800,
  assumptions: {
    panel_wattage_w: 550,
    system_losses_pct: 15,
    system_lifetime_years: 25,
    degradation_rate_pct_per_year: 0.5,
    maintenance_cost_pct_of_capex: 1.5,
    co2_factor_kg_per_kwh: 0.4,
  },
};
