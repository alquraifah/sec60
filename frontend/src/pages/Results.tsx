import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowRight, Download, Sun, Zap, TrendingUp,
  Leaf, DollarSign, Calendar, Battery, BarChart2,
  Home, Cpu, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import FeasibilityGauge from '../components/FeasibilityGauge'
import MetricCard from '../components/MetricCard'
import AIAssistant from '../components/AIAssistant'
import SavingsChart from '../components/charts/SavingsChart'
import MonthlyProductionChart from '../components/charts/MonthlyProductionChart'
import CostComparisonChart from '../components/charts/CostComparisonChart'
import { api, DEMO_RESULT } from '../services/api'
import { useLang } from '../context/LanguageContext'
import type { AnalysisResult } from '../types'

export default function Results() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { t, lang } = useLang()

  const [reportLoading, setReportLoading] = useState(false)
  const [reportError,   setReportError]   = useState<string | null>(null)

  const result: AnalysisResult = location.state?.result ?? DEMO_RESULT
  const isDemo: boolean        = location.state?.isDemo ?? !location.state?.result

  const fin = result.financial
  const ai  = result.ai_explanation

  const gaugeColor = (
    result.feasibility_score >= 80 ? 'green'
    : result.feasibility_score >= 65 ? 'lime'
    : result.feasibility_score >= 45 ? 'yellow'
    : result.feasibility_score >= 20 ? 'orange'
    : 'red'
  ) as 'green' | 'lime' | 'yellow' | 'orange' | 'red'

  const downloadReport = async () => {
    setReportError(null)
    setReportLoading(true)
    try {
      const url = await api.generateReport(result)
      window.open(url, '_blank')
    } catch (e: any) {
      setReportError(e?.message ?? 'فشل توليد التقرير')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:border-lime-400 hover:bg-lime-50 transition-all"
            >
              <ArrowRight size={16} className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-lg font-black text-navy-900">{t('results.title')}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-slate-400 text-xs">
                  {result.city.name_ar} • {result.facility_type_label} • {result.system_type_label}
                </span>
                {isDemo && (
                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-700 text-[10px] font-bold rounded-full">
                    تجريبي
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={downloadReport}
            disabled={reportLoading}
            className="btn-primary text-sm py-2.5 px-5"
          >
            <Download size={15} />
            {reportLoading ? t('results.generating') : t('results.download')}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Report error */}
        {reportError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in">
            ⚠️ {reportError}
          </div>
        )}

        {/* ── AI BADGE ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 bg-lime-50 border border-lime-200 rounded-2xl px-5 py-3 animate-fade-in">
          <Cpu size={17} className="text-lime-600 shrink-0" />
          <span className="text-sm font-bold text-lime-800">{t('results.ai.badge')}</span>
          <div className="mr-auto flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {result.solar_data.data_source === 'open_meteo_live' ? '🌐 Open-Meteo Live'
               : result.solar_data.data_source === 'demo_mode' ? '🎯 Demo'
               : '📦 Local dataset'}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              result.ml_model_used.includes('forest') || result.ml_model_used.includes('sec60')
                ? 'bg-lime-100 text-lime-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {result.ml_model_used === 'sec60_random_forest' || result.ml_model_used === 'random_forest'
                ? '✅ RandomForest' : '⚙️ Formula'}
            </span>
          </div>
        </div>

        {/* ── TOP SECTION: GAUGE + METRICS ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* Gauge */}
          <div className="md:col-span-3 card p-6 flex flex-col items-center justify-between gap-4 animate-slide-up">
            <FeasibilityGauge
              score={result.feasibility_score}
              label={ai.recommendation_ar}
              color={gaugeColor}
            />
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { label: 'المدينة',     val: result.city.name_ar,            color: 'text-navy-900' },
                { label: 'PSH/يوم',    val: `${result.solar_data.peak_sun_hours}`, color: 'text-lime-600' },
                { label: 'الاستهلاك',   val: `${Math.round(result.monthly_kwh_input).toLocaleString()} kWh`, color: 'text-slate-700' },
                { label: 'النظام',      val: result.system_type_label,        color: 'text-cyan-600' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 mb-0.5">{item.label}</p>
                  <p className={`text-xs font-bold truncate ${item.color}`}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 6 Metric cards */}
          <div className="md:col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              label={t('m.system')}
              value={fin.actual_system_kw}
              unit="kW"
              icon={<Zap size={18} />}
              accent="lime"
              sublabel={`${fin.num_panels} ${t('m.panels.sub')}`}
            />
            <MetricCard
              label={t('m.savings')}
              value={fin.annual_savings_sar.toLocaleString()}
              unit="ريال/سنة"
              icon={<DollarSign size={18} />}
              accent="lime"
              sublabel={`${fin.monthly_savings_sar.toLocaleString()} ريال/شهر`}
            />
            <MetricCard
              label={t('m.payback')}
              value={fin.payback_years}
              unit="سنة"
              icon={<Calendar size={18} />}
              accent="cyan"
              sublabel="فترة استرداد الاستثمار"
            />
            <MetricCard
              label={t('m.roi')}
              value={`${fin.roi_25yr_pct}%`}
              unit=""
              icon={<TrendingUp size={18} />}
              accent="lime"
              sublabel="صافي العائد 25 سنة"
            />
            <MetricCard
              label={t('m.cost')}
              value={fin.installation_cost_sar.toLocaleString()}
              unit="ريال"
              icon={<Battery size={18} />}
              accent="amber"
              sublabel={`${(fin.installation_cost_sar / fin.actual_system_kw / 1000).toFixed(1)}K ر./كيلوواط`}
            />
            <MetricCard
              label={t('m.co2')}
              value={fin.annual_co2_tons}
              unit="طن/سنة"
              icon={<Leaf size={18} />}
              accent="lime"
              sublabel={`= ${fin.trees_equivalent} شجرة`}
            />
          </div>
        </div>

        {/* ── PRODUCTION ROW ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('m.daily'),  value: `${fin.daily_production_kwh}`, unit: 'kWh/يوم' },
            { label: 'المتوسط الشهري', value: Math.round(fin.annual_production_kwh/12).toLocaleString(), unit: 'kWh' },
            { label: t('m.annual'), value: fin.annual_production_kwh.toLocaleString(), unit: 'kWh/سنة' },
            { label: 'CO₂ المدى البعيد', value: fin.lifetime_co2_tons, unit: 'طن / 25 سنة' },
          ].map(m => (
            <div key={m.label} className="card px-4 py-3 animate-fade-in">
              <p className="text-[11px] text-slate-400 mb-1">{m.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-cyan-600">{m.value}</span>
                <span className="text-xs text-slate-400">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="section-title">
              <TrendingUp size={18} className="text-lime-600" />
              {t('chart.savings')}
            </h3>
            <SavingsChart data={fin.savings_by_year} installationCost={fin.installation_cost_sar} />
          </div>
          <div className="card p-6">
            <h3 className="section-title">
              <Sun size={18} className="text-lime-600" />
              {t('chart.monthly')}
            </h3>
            <MonthlyProductionChart data={fin.monthly_production_kwh} />
          </div>
        </div>

        <div className="card p-6">
          <h3 className="section-title">
            <BarChart2 size={18} className="text-lime-600" />
            {t('chart.compare')}
          </h3>
          <CostComparisonChart
            savingsByYear={fin.savings_by_year}
            annualBillSar={fin.annual_savings_sar}
            installationCost={fin.installation_cost_sar}
          />
        </div>

        {/* ── AI ADVISOR ──────────────────────────────────────────── */}
        <AIAssistant explanation={ai} />

        {/* ── ASSUMPTIONS ─────────────────────────────────────────── */}
        <div className="card p-6">
          <h3 className="section-title">
            <Cpu size={16} className="text-slate-400" />
            <span className="text-slate-700 text-sm">{t('asmp.title')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[
              { l: 'قدرة اللوح',     v: '550 W' },
              { l: 'خسائر النظام',   v: '15%' },
              { l: 'عمر النظام',     v: '25 سنة' },
              { l: 'تدهور سنوي',     v: '0.5%/سنة' },
              { l: 'معامل CO₂',     v: '0.40 كغ/كوس' },
              { l: 'نموذج AI',       v: result.ml_model_used.includes('forest') ? '✅ RandomForest' : '⚙️ Formula' },
            ].map(a => (
              <div key={a.l} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-1">{a.l}</p>
                <p className="text-sm font-bold text-navy-800">{a.v}</p>
              </div>
            ))}
          </div>
          <div className="bg-lime-50 border border-lime-200 rounded-xl px-5 py-3 flex items-start gap-2">
            <CheckCircle2 size={15} className="text-lime-600 shrink-0 mt-0.5" />
            <p className="text-xs text-lime-800 font-semibold leading-5">
              {t('ai.positioning')}
            </p>
          </div>
        </div>

        {/* ── BOTTOM ACTIONS ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button onClick={() => navigate('/')} className="btn-secondary flex-1">
            <Home size={16} />
            {t('results.back')}
          </button>
          <button onClick={downloadReport} disabled={reportLoading} className="btn-primary flex-1">
            <Download size={16} />
            {reportLoading ? t('results.generating') : t('results.download')}
          </button>
        </div>
      </main>
    </>
  )
}
