import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, FileText, TrendingUp, Leaf, Zap, AlertCircle } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { useLanguage } from '../../context/LanguageContext';
import { generateReport, getReportDownloadUrl } from '../../services/api';
import { fmtNumber } from '../../utils/formatters';

export default function ReportPreview() {
  const { result } = useAnalysis();
  const { t, lang } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  if (!result) return null;

  const fin = result.financial;
  const sys = result.system;
  const ai = result.ai_explanation;

  const [downloadUrl, setDownloadUrl] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    setDownloadUrl('');
    try {
      const res = await generateReport(result as unknown as Record<string, unknown>, lang);
      if (res.success && res.filename) {
        const url = getReportDownloadUrl(res.filename);
        setDownloadUrl(url);

        // Use a hidden <a> link click instead of window.open — works on Safari iOS
        const link = document.createElement('a');
        link.href = url;
        link.download = res.filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } catch {
      setError('Report service unavailable. Make sure the backend is running.');
    } finally {
      setDownloading(false);
    }
  };

  const getFeasibilityLabel = () => {
    const score = result.feasibility_score;
    if (score >= 80) return t.dashboard.feasibility.excellent;
    if (score >= 65) return t.dashboard.feasibility.good;
    if (score >= 45) return t.dashboard.feasibility.fair;
    return t.dashboard.feasibility.poor;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 border-l-4 border-teal-500"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-800">{t.report.sections.executive}</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {lang === 'ar' ? ai.summary_ar : ai.summary_en}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">Score</p>
            <p className="text-xl font-bold text-teal-600">{result.feasibility_score}/100</p>
            <p className="text-xs text-slate-400">{getFeasibilityLabel()}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">{t.dashboard.systemSize}</p>
            <p className="text-xl font-bold text-sky-600">{sys.actual_kw} kW</p>
            <p className="text-xs text-slate-400">{sys.num_panels} panels</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">{t.dashboard.savings}</p>
            <p className="text-xl font-bold text-green-600">{fmtNumber(fin.annual_savings_sar)}</p>
            <p className="text-xs text-slate-400">SAR/year</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500">{t.dashboard.payback}</p>
            <p className="text-xl font-bold text-amber-600">{fin.payback_years}</p>
            <p className="text-xs text-slate-400">{t.dashboard.years}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-800">{t.report.sections.financial}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">{t.dashboard.installCost}</span>
            <span className="text-sm font-semibold text-slate-800">{fmtNumber(fin.installation_cost_sar)} SAR</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">{t.dashboard.savings}</span>
            <span className="text-sm font-semibold text-green-600">{fmtNumber(fin.annual_savings_sar)} SAR/yr</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Monthly Savings</span>
            <span className="text-sm font-semibold text-green-600">{fmtNumber(fin.monthly_savings_sar)} SAR/mo</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">{t.dashboard.roi}</span>
            <span className="text-sm font-semibold text-teal-600">{fin.roi_25yr_pct}%</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">{t.dashboard.payback}</span>
            <span className="text-sm font-semibold text-sky-600">{fin.payback_years} {t.dashboard.years}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Tariff</span>
            <span className="text-sm font-semibold text-slate-800">{fin.tariff_sar_kwh} SAR/kWh</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-800">{t.report.sections.technical}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">System Size</span>
            <span className="text-sm font-semibold">{sys.actual_kw} kW</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Panels</span>
            <span className="text-sm font-semibold">{sys.num_panels} x 550W</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Daily Production</span>
            <span className="text-sm font-semibold">{fin.daily_production_kwh} kWh</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Annual Production</span>
            <span className="text-sm font-semibold">{fmtNumber(fin.annual_production_kwh)} kWh</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Peak Sun Hours</span>
            <span className="text-sm font-semibold">{result.solar_data.peak_sun_hours} h/day</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Data Source</span>
            <span className="text-sm font-semibold capitalize">{result.solar_data.data_source.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800">{t.report.sections.carbon}</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{fin.annual_co2_tons}</p>
            <p className="text-xs text-emerald-700">Tons CO₂/year</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{fin.lifetime_co2_tons}</p>
            <p className="text-xs text-emerald-700">Lifetime tons</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{fmtNumber(fin.trees_equivalent)}</p>
            <p className="text-xs text-emerald-700">Trees equivalent</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card p-8 border-l-4 border-teal-500"
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{t.report.sections.recommendations}</h2>
        <div className="space-y-3">
          {(lang === 'ar' ? ai.reasons_ar : ai.reasons_en).map((r, i) => (
            <p key={i} className="text-sm text-slate-600">{r}</p>
          ))}
        </div>
        {(lang === 'ar' ? ai.risks_ar : ai.risks_en).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">Considerations:</p>
            {(lang === 'ar' ? ai.risks_ar : ai.risks_en).map((r, i) => (
              <p key={i} className="text-sm text-slate-500">{r}</p>
            ))}
          </div>
        )}
      </motion.div>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-primary flex-1 justify-center py-4"
        >
          {downloading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Generating PDF...</>
          ) : (
            <><Download className="w-5 h-5" />{t.report.download}</>
          )}
        </button>
      </motion.div>

      {downloadUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3"
        >
          <Download className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700">PDF ready — </span>
          <a
            href={downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-green-700 underline"
          >
            Tap here to download
          </a>
        </motion.div>
      )}

      <p className="text-center text-xs text-slate-400">{t.report.generated}</p>
    </div>
  );
}
