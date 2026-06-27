import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Clock, Zap, Sun, Leaf,
  Download, MessageSquare, RefreshCw,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MetricCard from '../components/dashboard/MetricCard';
import FeasibilityGauge from '../components/dashboard/FeasibilityGauge';
import CashFlowChart from '../components/dashboard/CashFlowChart';
import { useAnalysis } from '../context/AnalysisContext';
import { useLanguage } from '../context/LanguageContext';
import { fmtNumber } from '../utils/formatters';

export default function Dashboard() {
  const { result, reset } = useAnalysis();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!result) navigate('/calculator');
  }, [result, navigate]);

  if (!result) return null;

  const fin = result.financial;
  const sys = result.system;
  const ai = result.ai_explanation;

  const getFeasibilityLabel = () => {
    const score = result.feasibility_score;
    if (score >= 80) return t.dashboard.feasibility.excellent;
    if (score >= 65) return t.dashboard.feasibility.good;
    if (score >= 45) return t.dashboard.feasibility.fair;
    return t.dashboard.feasibility.poor;
  };

  const metrics = [
    { title: t.dashboard.savings, value: fmtNumber(fin.annual_savings_sar), unit: 'SAR/yr', icon: DollarSign, color: 'teal' },
    { title: t.dashboard.roi, value: `${fin.roi_25yr_pct}`, unit: '%', icon: TrendingUp, color: 'green' },
    { title: t.dashboard.payback, value: `${fin.payback_years}`, unit: t.dashboard.years, icon: Clock, color: 'sky' },
    { title: t.dashboard.systemSize, value: `${sys.actual_kw}`, unit: t.dashboard.kw, icon: Zap, color: 'amber' },
    { title: t.dashboard.panels, value: `${sys.num_panels}`, unit: 'panels', icon: Sun, color: 'amber' },
    { title: t.dashboard.carbonReduction, value: `${fin.annual_co2_tons}`, unit: t.dashboard.co2, icon: Leaf, color: 'emerald' },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <span className="badge-teal mb-2">{t.dashboard.badge}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">{t.dashboard.title}</h1>
              <p className="text-slate-500 text-sm mt-1">{t.dashboard.subtitle}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/assistant" className="btn-secondary text-sm py-2 px-4">
                <MessageSquare className="w-4 h-4" />
                {t.nav.assistant}
              </Link>
              <Link to="/report" className="btn-primary text-sm py-2 px-4">
                <Download className="w-4 h-4" />
                {t.dashboard.downloadReport}
              </Link>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-1">
              <FeasibilityGauge score={result.feasibility_score} label={getFeasibilityLabel()} />
            </div>
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {metrics.map((m, i) => (
                <MetricCard key={m.title} {...m} index={i} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="metric-card"
            >
              <p className="text-xs font-medium text-slate-500 mb-2">{t.dashboard.installCost}</p>
              <p className="text-2xl font-bold text-sky-700">{fmtNumber(fin.installation_cost_sar)}</p>
              <p className="text-xs text-slate-400">SAR</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56 }}
              className="metric-card"
            >
              <p className="text-xs font-medium text-slate-500 mb-2">{t.dashboard.monthlyGen}</p>
              <p className="text-2xl font-bold text-teal-700">{fmtNumber(fin.annual_production_kwh / 12)}</p>
              <p className="text-xs text-slate-400">kWh/month</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              className="metric-card"
            >
              <p className="text-xs font-medium text-slate-500 mb-2">Trees Equivalent</p>
              <p className="text-2xl font-bold text-emerald-700">{fmtNumber(fin.trees_equivalent)}</p>
              <p className="text-xs text-slate-400">trees/year</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68 }}
              className="metric-card"
            >
              <p className="text-xs font-medium text-slate-500 mb-2">AI Model</p>
              <span className="badge-teal text-xs">
                {result.ml_model_used === 'random_forest' ? 'Random Forest' : 'Formula Engine'}
              </span>
            </motion.div>
          </div>

          <div className="mb-6">
            <CashFlowChart data={fin.savings_by_year} paybackYears={fin.payback_years} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="card p-6 mb-6 border-l-4 border-teal-500"
          >
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              {t.dashboard.recommendation}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${
                ai.color === 'green' ? 'badge-green' :
                ai.color === 'lime' ? 'badge-green' :
                ai.color === 'yellow' ? 'badge-amber' : 'badge-red'
              }`}>
                {lang === 'ar' ? ai.recommendation_ar : ai.recommendation_en}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {lang === 'ar' ? ai.summary_ar : ai.summary_en}
            </p>
            <div className="space-y-1">
              {(lang === 'ar' ? ai.reasons_ar : ai.reasons_en).map((r, i) => (
                <p key={i} className="text-sm text-slate-500">{r}</p>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/report" className="btn-primary">
              <Download className="w-4 h-4" />
              {t.dashboard.downloadReport}
            </Link>
            <Link to="/assistant" className="btn-secondary">
              <MessageSquare className="w-4 h-4" />
              {t.nav.assistant}
            </Link>
            <button
              onClick={() => { reset(); navigate('/calculator'); }}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              {t.dashboard.newAnalysis}
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
