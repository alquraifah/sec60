export type FacilityType = 'residential' | 'commercial' | 'factory' | 'farm' | 'remote';
export type SystemType = 'grid_tied' | 'hybrid' | 'off_grid';

export interface AnalyzeRequest {
  city: string;
  facility_type: FacilityType;
  system_type: SystemType;
  monthly_bill_sar?: number;
  monthly_consumption_kwh?: number;
  area_sqm?: number;
}

export interface CityInfo {
  id: string;
  name_ar: string;
  name_en: string;
  peak_sun_hours: number;
  region_ar: string;
}

export interface SolarData {
  peak_sun_hours: number;
  avg_temp_c: number;
  data_source: string;
}

export interface SystemInfo {
  recommended_kw: number;
  actual_kw: number;
  num_panels: number;
}

export interface YearlySavings {
  year: number;
  savings: number;
  cumulative: number;
}

export interface Financial {
  num_panels: number;
  actual_system_kw: number;
  daily_production_kwh: number;
  monthly_production_kwh: number[];
  annual_production_kwh: number;
  tariff_sar_kwh: number;
  annual_savings_sar: number;
  monthly_savings_sar: number;
  installation_cost_sar: number;
  payback_years: number;
  roi_25yr_pct: number;
  savings_by_year: YearlySavings[];
  annual_co2_tons: number;
  lifetime_co2_tons: number;
  trees_equivalent: number;
}

export interface AIExplanation {
  recommendation_key: string;
  recommendation_ar: string;
  color: string;
  summary_ar: string;
  reasons_ar: string[];
  risks_ar: string[];
  next_steps_ar: string[];
}

export interface AnalysisResult {
  city: CityInfo;
  solar_data: SolarData;
  system: SystemInfo;
  financial: Financial;
  feasibility_score: number;
  ml_model_used: string;
  ai_explanation: AIExplanation;
  facility_type: FacilityType;
  facility_type_label: string;
  system_type: SystemType;
  system_type_label: string;
  monthly_kwh_input: number;
  assumptions: Record<string, number>;
}

export interface OCRResult {
  success: boolean;
  extracted_kwh: number | null;
  extracted_sar: number | null;
  confidence: number;
  raw_text_preview?: string;
  error?: string;
}
