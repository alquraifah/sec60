import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowRight, Download, Sun, Battery, Zap,
  TrendingUp, Leaf, DollarSign, Calendar, BarChart2,
  Home, Cpu,
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
  const location = useLocation()
  const navigate  = useNavigate()
  const { t, lang } = useLang()

  const [reportLoading, setReportLoading] = useState(false)

  const result: AnalysisResult = location.state?.result ?? DEMO_RESULT
  const isDemo: boolean        = location.state?.isDemo ?? !location.state?.result

  const fin = result.financial
  const ai  = result.ai_explanation

  const downloadReport = async () => {
    setReportLoading(true)
    try {
      const url = await api.generateReport(result)
      window.open(url, '_blank')
    } catch (e: any) {
      alert(e?.message ?? 'فشل في توليد التقرير')
    } finally {
      setReportLoading(false)
    }
  }

  const gaugeColor = (
    result.feasibility_score >= 80 ? 'green'
    : result.feasibility_score >= 65 ? 'lime'
    : result.feasibility_score >= 45 ? 'yellow'
    : result.feasibility_score >= 20 ? 'orange'
    : 'red'
  ) as 'green'|'lime'|'yellow'|'orange'|'red'

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-lime-400 transition-all shadow-sm">
              <ArrowRight size={16} className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-navy-900">{t('results.title')}</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {result.city.name_ar} — {result.facility_type_label} — {result.system_type_label}
                {isDemo && (
                  <span className="mr-2 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-amber-700 text-[10px] font-bold">
                    {t('results.demo')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={downloadReport} disabled={reportLoading}
            className="btn-primary flex items-center gap-2 text-sm">
            <Download size={15} />
            {reportLoading ? t('results.generating') : t('results.download')}
          </button>
        </div>

        {/* AI badge */}
        <div className="flex items-center gap-2 bg-lime-50 border border-lime-200 rounded-xl px-4 py-3">
          <Cpu size={16} className="text-lime-600 shrink-0" />
          <span className="text-sm font-bold text-lime-700">{t('results.ai.badge')}</span>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gauge */}
          <div className="card p-6 flex flex-col items-center justify-center">
            <FeasibilityGauge
              score={result.feasibility_score}
              label={ai.recommendation_ar}
              color={gaugeColor}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-center">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                <p className="text-[10px] text-slate-400">{lang==='ar'?'المدينة':'City'}</p>
                <p className="text-sm font-bold text-navy-900">{result.city.name_ar}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                <p className="text-[10px] text-slate-400">PSH</p>
                <p className="text-sm font-bold text-lime-600">{result.solar_data.peak_sun_hours} hr/day</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 col-span-2">
                <p className="text-[10px] text-slate-400">{lang==='ar'?'مصدر البيانات':'Data Source'}</p>
                <p className="text-xs font-semibold text-solar-cyan">
                  {result.solar_data.data_source === 'open_meteo_live' ? '🌐 Open-Meteo Live'
                   : result.solar_data.data_source === 'demo_mode' ? '🎯 Demo Data'
                   : '📦 Local Dataset'}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label={t('m.system')}  value={fin.actual_system_kw}  unit="kW"    icon={<Zap size={18}/>}         accent="lime"  sublabel={`${fin.num_panels} ${t('m.panels.sub')}`} />
            <MetricCard label={t('m.savings')} value={fin.annual_savings_sar.toLocaleString()} unit="SAR/yr" icon={<DollarSign size={18}/>} accent="lime"  sublabel={`${fin.monthly_savings_sar.toLocaleString()} SAR/mo`} />
            <MetricCard label={t('m.payback')} value={fin.payback_years}     unit="yrs"   icon={<Calendar size={18}/>}    accent="cyan"  sublabel="حتى استرداد الاستثمار" />
            <MetricCard label={t('m.roi')}     value={fin.roi_25yr_pct}      unit="%"     icon={<TrendingUp size={18}/>}  accent="lime"  sublabel="صافي العائد على الاستثمار" />
            <MetricCard label={t('m.cost')}    value={fin.installation_cost_sar.toLocaleString()} unit="SAR" icon={<Battery size={18}/>} accent="amber" sublabel={`${(fin.installation_cost_sar/fin.actual_system_kw/1000).toFixed(1)}K SAR/kW`} />
            <MetricCard label={t('m.co2')}     value={fin.annual_co2_tons}   unit="ton/yr"icon={<Leaf size={18}/>}        accent="lime"  sublabel={`=${fin.trees_equivalent} trees`} />
          </div>
        </div>

        {/* Production row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: t('m.daily'),  v: fin.daily_production_kwh,                           u:'kWh/day' },
            { l: 'Monthly Avg', v: Math.round(fin.annual_production_kwh/12).toLocaleString(), u:'kWh' },
            { l: t('m.annual'), v: fin.annual_production_kwh.toLocaleString(),           u:'kWh/yr' },
            { l: 'Lifetime CO₂',v: fin.lifetime_co2_tons,                               u:'tons' },
          ].map(m => (
            <div key={m.l} className="card px-4 py-3">
              <p className="text-[11px] text-slate-400 mb-0.5">{m.l}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-solar-cyan">{m.v}</span>
                <span className="text-xs text-slate-400">{m.u}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="section-title"><TrendingUp size={18} className="text-lime-600" />{t('chart.savings')}</h3>
            <SavingsChart data={fin.savings_by_year} installationCost={fin.installation_cost_sar} />
          </div>
          <div className="card p-5">
            <h3 className="section-title"><Sun size={18} className="text-lime-600" />{t('chart.monthly')}</h3>
            <MonthlyProductionChart data={fin.monthly_production_kwh} />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title"><BarChart2 size={18} className="text-lime-600" />{t('chart.compare')}</h3>
          <CostComparisonChart
            savingsByYear={fin.savings_by_year}
            annualBillSar={fin.annual_savings_sar}
            installationCost={fin.installation_cost_sar}
          />
        </div>

        {/* SEC60 AI Advisor */}
        <AIAssistant explanation={ai} />

        {/* Assumptions */}
        <div className="card p-5">
          <h3 className="section-title text-base">
            <Cpu size={16} className="text-slate-400" />
            <span className="text-slate-700">{t('asmp.title')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            {[
              { l:'Panel', v:'550 W' },
              { l:'Losses', v:'15%' },
              { l:'Lifetime', v:'25 yr' },
              { l:'Degradation', v:'0.5%/yr' },
              { l:'CO₂ factor', v:'0.40 kg/kWh' },
              { l:'ML Model', v: result.ml_model_used === 'sec60_random_forest' ? 'RandomForest ✅' : result.ml_model_used === 'random_forest' ? 'RandomForest ✅' : 'Formula ⚙️' },
            ].map(a => (
              <div key={a.l} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-1">{a.l}</p>
                <p className="text-sm font-bold text-navy-800">{a.v}</p>
              </div>
            ))}
          </div>
          {/* Strong positioning — no disclaimers */}
          <div className="bg-lime-50 border border-lime-200 rounded-xl px-4 py-3">
            <p className="text-xs text-lime-800 font-semibold text-center">
              {t('ai.positioning')}
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button onClick={() => navigate('/')} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Home size={16} />{t('results.back')}
          </button>
          <button onClick={downloadReport} disabled={reportLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Download size={16} />{reportLoading ? t('results.generating') : t('results.download')}
          </button>
        </div>
      </main>
    </>
  )
}
