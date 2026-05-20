import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sun, TrendingUp, Leaf, Clock, CheckCircle,
  Cpu, Database, FileText, Zap, ChevronLeft,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import InputForm from '../components/InputForm'
import LoadingAnimation from '../components/LoadingAnimation'
import ApiStatusBanner from '../components/ApiStatusBanner'
import { api, DEMO_RESULT } from '../services/api'
import { useLang } from '../context/LanguageContext'
import type { AnalyzeRequest, CityInfo } from '../types'

const AI_STACK = [
  { icon: Cpu,      label: 'RandomForest ML',       color: 'text-lime-600',  bg: 'bg-lime-50  border-lime-200'  },
  { icon: Database, label: 'Solar Irradiance Engine',color: 'text-cyan-600',  bg: 'bg-cyan-50  border-cyan-200'  },
  { icon: Zap,      label: 'SEC60 AI Advisor',       color: 'text-violet-600',bg: 'bg-violet-50 border-violet-200'},
  { icon: FileText, label: 'PDF Report Generator',   color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
]

const STATS = [
  { icon: Sun,        val: '6.4', unit: 'PSH',  label: 'أعلى إشعاع شمسي',   sub: 'العُلا — تبوك' },
  { icon: TrendingUp, val: '25',  unit: 'سنة',  label: 'عمر النظام',          sub: 'مضمون' },
  { icon: Leaf,       val: '0.4', unit: 'كغ/كوس',label: 'معامل CO₂',          sub: 'الشبكة السعودية' },
  { icon: Clock,      val: '60',  unit: 'ث',    label: 'وقت التحليل',          sub: 'من الإدخال للنتيجة' },
]

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const [loading,      setLoading]      = useState(false)
  const [cities,       setCities]       = useState<CityInfo[]>([])
  const [apiOnline,    setApiOnline]    = useState<boolean | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => {
    if (apiOnline) api.getCities().then(setCities).catch(() => {})
  }, [apiOnline])

  const handleAnalyze = async (req: AnalyzeRequest) => {
    setAnalyzeError(null)
    setLoading(true)
    try {
      const result = await api.analyze(req)
      navigate('/results', { state: { result } })
    } catch (err: any) {
      setAnalyzeError(err?.message ?? 'خطأ غير معروف')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <LoadingAnimation />}
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-navy-900 overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid opacity-100" />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,rgba(132,204,22,0.12),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left text */}
            <div className="animate-slide-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-lime-500/15 border border-lime-500/30 text-lime-400 rounded-full px-4 py-1.5 text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                منصة ذكاء اصطناعي — Solar AI Platform
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
                قرار الطاقة الشمسية
                <span className="block text-lime-400 text-glow mt-1">
                  خلال 60 ثانية ⚡
                </span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                تحليل الجدوى الاقتصادية للطاقة الشمسية مدعوم بالذكاء الاصطناعي —
                للمزارع والمصانع والمنشآت في المملكة العربية السعودية
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[t('hero.f1'), t('hero.f2'), t('hero.f3'), t('hero.f4')].map(f => (
                  <span key={f} className="chip-navy text-slate-300 bg-white/5 border-white/10">
                    <CheckCircle size={10} className="text-lime-400" />
                    {f}
                  </span>
                ))}
              </div>

              {/* AI Stack */}
              <div className="grid grid-cols-2 gap-2.5">
                {AI_STACK.map(({ icon: Icon, label, color, bg }) => (
                  <div key={label}
                    className={`flex items-center gap-2.5 ${bg} border rounded-xl px-3 py-2.5`}>
                    <Icon size={15} className={color} />
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: stats */}
            <div className="grid grid-cols-2 gap-3 animate-slide-right">
              {STATS.map(({ icon: Icon, val, unit, label, sub }) => (
                <div key={label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5
                             hover:bg-white/8 hover:border-lime-500/30 transition-all duration-200">
                  <Icon size={20} className="text-lime-400 mb-3" />
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-black text-white">{val}</span>
                    <span className="text-sm text-slate-400 font-medium">{unit}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* API Status */}
        <ApiStatusBanner onStatusChange={setApiOnline} />

        {/* Error */}
        {analyzeError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 animate-fade-in">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <p className="font-bold text-red-800 text-sm">فشل التحليل</p>
              <p className="text-xs text-red-600 mt-0.5 leading-5">{analyzeError}</p>
            </div>
          </div>
        )}

        {/* Form + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Form card */}
          <div className="lg:col-span-3 card p-7 animate-slide-up">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-navy-900">أدخل بيانات منشأتك</h2>
              <p className="text-slate-500 text-sm mt-1">
                احصل على تقرير جدوى كامل مع تحليل ذكاء اصطناعي خلال 60 ثانية
              </p>
            </div>
            <InputForm
              cities={cities}
              loading={loading}
              onSubmit={handleAnalyze}
              onDemoClick={() => navigate('/results', { state: { result: DEMO_RESULT, isDemo: true } })}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">

            {/* How it works */}
            <div className="card p-6">
              <h3 className="font-bold text-navy-900 mb-5 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 bg-lime-100 border border-lime-200 text-lime-700 rounded-lg flex items-center justify-center text-xs font-bold">
                  ?
                </span>
                كيف يعمل SEC60؟
              </h3>
              <ol className="space-y-4">
                {[
                  { n: '1', text: 'أدخل بيانات المنشأة والاستهلاك',         c: 'bg-lime-500' },
                  { n: '2', text: 'نجلب بيانات الإشعاع من Open-Meteo API', c: 'bg-cyan-500'  },
                  { n: '3', text: 'يُحلل نموذج RandomForest الجدوى',        c: 'bg-violet-500'},
                  { n: '4', text: 'تقرير كامل + توصية AI + PDF',           c: 'bg-lime-500' },
                ].map(step => (
                  <li key={step.n} className="flex items-start gap-3">
                    <span className={`w-6 h-6 ${step.c} text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm`}>
                      {step.n}
                    </span>
                    <span className="text-sm text-slate-600 leading-6">{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cities */}
            {cities.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-3 text-sm">🗺️ المدن المدعومة</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map(c => (
                    <span key={c.id}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-600
                                 rounded-lg px-2.5 py-1 font-medium hover:border-lime-300
                                 hover:text-lime-700 transition-colors cursor-default">
                      {c.name_ar}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tech panel */}
            <div className="card-lime p-5">
              <p className="text-xs font-bold text-lime-700 mb-3 flex items-center gap-1.5">
                <Cpu size={13} /> AI Technologies Used
              </p>
              {[
                'RandomForest Feasibility Prediction',
                'Live Solar Irradiance Engine',
                'SEC60 AI Advisor (Rule-based + LLM ready)',
                'OCR Electricity Bill Reader',
                'Financial ROI Simulation (25yr)',
                'Bilingual PDF Report Generator',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                  <span className="text-xs text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          {t('footer')}
        </p>
      </main>
    </>
  )
}
