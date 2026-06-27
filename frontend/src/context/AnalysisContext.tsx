import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AnalysisInput {
  city: string;
  facility_type: string;
  monthly_bill_sar: number;
  monthly_consumption_kwh?: number;
}

export interface AnalysisResult {
  city: Record<string, unknown>;
  solar_data: {
    peak_sun_hours: number;
    avg_temp_c: number;
    data_source: string;
  };
  system: {
    recommended_kw: number;
    actual_kw: number;
    num_panels: number;
  };
  financial: {
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
    savings_by_year: { year: number; savings: number; cumulative: number }[];
    annual_co2_tons: number;
    lifetime_co2_tons: number;
    trees_equivalent: number;
  };
  feasibility_score: number;
  ml_model_used: string;
  ai_explanation: {
    recommendation_key: string;
    recommendation_ar: string;
    recommendation_en: string;
    color: string;
    summary_ar: string;
    summary_en: string;
    reasons_ar: string[];
    reasons_en: string[];
    risks_ar: string[];
    risks_en: string[];
    next_steps_ar: string[];
    next_steps_en: string[];
  };
  facility_type: string;
  facility_type_label: string;
  facility_type_label_en: string;
  system_type: string;
  system_type_label: string;
  system_type_label_en: string;
  monthly_kwh_input: number;
  assumptions: Record<string, unknown>;
}

interface AnalysisContextType {
  input: AnalysisInput | null;
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  setInput: (input: AnalysisInput) => void;
  setResult: (result: AnalysisResult) => void;
  setIsAnalyzing: (v: boolean) => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState<AnalysisInput | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const reset = () => {
    setInput(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  return (
    <AnalysisContext.Provider
      value={{ input, result, isAnalyzing, setInput, setResult, setIsAnalyzing, reset }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
