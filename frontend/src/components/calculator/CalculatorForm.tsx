import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { CITIES } from '../../data/cities';
import { analyzeProject } from '../../services/api';
import OCRUpload from './OCRUpload';

const facilityTypes = ['residential', 'commercial', 'factory', 'farm', 'remote'] as const;

interface Props {
  onComplete: () => void;
}

export default function CalculatorForm({ onComplete }: Props) {
  const { t, lang } = useLanguage();
  const { setInput, setResult, setIsAnalyzing } = useAnalysis();

  const [city, setCity] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [monthlyBill, setMonthlyBill] = useState('');
  const [monthlyConsumption, setMonthlyConsumption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleOCR = (data: { bill?: number; kwh?: number }) => {
    if (data.bill) setMonthlyBill(String(data.bill));
    if (data.kwh) setMonthlyConsumption(String(data.kwh));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!city) e.city = 'Please select a city';
    if (!facilityType) e.facilityType = 'Please select a facility type';

    const bill = parseFloat(monthlyBill);
    const kwh = parseFloat(monthlyConsumption);

    if (!monthlyBill && !monthlyConsumption) {
      e.monthlyBill = 'Enter bill amount or consumption';
    }
    if (monthlyBill && (isNaN(bill) || bill <= 0)) {
      e.monthlyBill = 'Enter a valid positive amount';
    }
    if (monthlyBill && bill > 500000) {
      e.monthlyBill = 'Bill amount seems too high. Please verify.';
    }
    if (monthlyBill && bill > 0 && bill < 10) {
      e.monthlyBill = 'Bill amount seems too low. Please verify.';
    }
    if (monthlyConsumption && (isNaN(kwh) || kwh < 0)) {
      e.monthlyConsumption = 'Enter a valid consumption value';
    }
    if (monthlyConsumption && kwh > 1000000) {
      e.monthlyConsumption = 'Consumption seems too high. Please verify.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setIsAnalyzing(true);
    setApiError('');

    const payload = {
      city,
      facility_type: facilityType,
      system_type: 'grid_tied' as const,
      monthly_bill_sar: monthlyBill ? parseFloat(monthlyBill) : undefined,
      monthly_consumption_kwh: monthlyConsumption ? parseFloat(monthlyConsumption) : undefined,
    };

    setInput({
      city,
      facility_type: facilityType,
      monthly_bill_sar: parseFloat(monthlyBill) || 0,
      monthly_consumption_kwh: monthlyConsumption ? parseFloat(monthlyConsumption) : undefined,
    });

    try {
      const result = await analyzeProject(payload);
      setResult(result);
      setIsAnalyzing(false);
      onComplete();
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setApiError(msg + '. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-5">Facility Details</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calc.city}</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`input-field ${errors.city ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            >
              <option value="">{t.calc.cityPlaceholder}</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === 'ar' ? c.nameAr : c.nameEn} ({c.peakSunHours}h sun)
                </option>
              ))}
            </select>
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calc.facilityType}</label>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              className={`input-field ${errors.facilityType ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            >
              <option value="">{t.calc.facilityPlaceholder}</option>
              {facilityTypes.map((ft) => (
                <option key={ft} value={ft}>
                  {t.calc.facilities[ft]}
                </option>
              ))}
            </select>
            {errors.facilityType && <p className="text-xs text-red-500 mt-1">{errors.facilityType}</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-5">Energy & Bill Data</h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calc.monthlyBill}</label>
            <input
              type="number"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
              placeholder={t.calc.billPlaceholder}
              className={`input-field ${errors.monthlyBill ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.monthlyBill && <p className="text-xs text-red-500 mt-1">{errors.monthlyBill}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.calc.monthlyConsumption}</label>
            <input
              type="number"
              value={monthlyConsumption}
              onChange={(e) => setMonthlyConsumption(e.target.value)}
              placeholder={t.calc.consumptionPlaceholder}
              className={`input-field ${errors.monthlyConsumption ? 'border-red-300' : ''}`}
            />
            {errors.monthlyConsumption && <p className="text-xs text-red-500 mt-1">{errors.monthlyConsumption}</p>}
          </div>
        </div>
      </div>

      <OCRUpload onExtracted={handleOCR} />

      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Analysis Failed</p>
            <p className="text-xs text-red-600 mt-0.5">{apiError}</p>
          </div>
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className="w-full btn-primary py-4 text-base justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.calc.analyzing}
          </>
        ) : (
          <>
            <BrainCircuit className="w-5 h-5" />
            {t.calc.analyze}
          </>
        )}
      </motion.button>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-xs text-slate-400">
            Running AI analysis — processing solar irradiation data, financial modeling, and generating recommendations...
          </p>
        </motion.div>
      )}
    </form>
  );
}
