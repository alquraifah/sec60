import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, TrendingUp, Leaf, Clock, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import InputForm from '../components/InputForm'
import LoadingAnimation from '../components/LoadingAnimation'
import ApiStatusBanner from '../components/ApiStatusBanner'
import { api, DEMO_RESULT } from '../services/api'
import { useLang } from '../context/LanguageContext'
import type { AnalyzeRequest, CityInfo } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()

  const [loading,      setLoading]      = useState(false)
  const [cities,       setCities]       = useState<CityInfo[]>([])
  const [apiOnline,    setApiOnline]    = useState<boolean|null>(null)
  const [analyzeError, setAnalyzeError] = useState<string|null>(null)

  useEffect(() => {
    if (apiOnline) {
      api.getCities().then(setCities).catch(() => {})
    }
  }, [apiOnline])

  const handleAnalyze = async (req: AnalyzeRequest) => {
    setAnalyzeError(null); setLoading(true)
    try {
      const result = await api.analyze(req)
      navigate('/results', { state: { result } })
    } catch (err: any) {
      setAnalyzeError(err?.message ?? 'خطأ غير معروف')
    } finally {
      setLoading(false)
    }
  }

  const STATS = [
    { icon: Sun,        value:'6.2+', unit:'PSH', label: t('m.daily') },
    { icon: TrendingUp, value:'25',   unit:t('m.payback').split(' ')[0], label:'عمر النظام' },
    { icon: Leaf,       value:'0.4',  unit:'kg/kWh', label: t('m.co2') },
    { icon: Clock,      value:'60',   unit:'ث',  label:'وقت التحليل' },
  ]

  return (
    <>
      {loading && <LoadingAnimation />}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiStatusBanner onStatusChange={setApiOnline} />

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 leading-tight mb-4">
            {t('hero.title')}
            <span className="text-lime-600 block mt-1">{t('hero.highlight')}</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['hero.f1','hero.f2','hero.f3','hero.f4'].map(k => (
              <span key={k} className="flex items-center gap-1.5 px-3 py-1 bg-lime-50 border border-lime-200 rounded-full text-xs text-lime-700 font-semibold">
                <CheckCircle size={10} className="text-lime-500" />
                {t(k)}
              </span>
            ))}
          </div>
        </div>

        {/* Analyze error inline */}
        {analyzeError && (
          <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700 flex items-start gap-3 animate-fade-in">
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="font-bold mb-0.5">فشل التحليل</p>
              <p className="text-xs opacity-80">{analyzeError}</p>
            </div>
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-3 card p-6 sm:p-8 animate-slide-up">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-navy-900">أدخل بيانات منشأتك</h2>
              <p className="text-slate-500 text-sm mt-1">احصل على تحليل جدوى كامل مع توصية AI خلال 60 ثانية</p>
            </div>
            <InputForm cities={cities} loading={loading} onSubmit={handleAnalyze} onDemoClick={() => navigate('/results', { state:{ result:DEMO_RESULT, isDemo:true }})} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">📊 {t('sidebar.stats')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {STATS.map(({ icon:Icon, value, unit, label }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={13} className="text-lime-600" />
                      <span className="text-[11px] text-slate-500">{label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-lime-600">{value}</span>
                      <span className="text-xs text-slate-400">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-3">🔄 {t('sidebar.how')}</h3>
              <ol className="space-y-2.5">
                {(['sidebar.s1','sidebar.s2','sidebar.s3','sidebar.s4'] as const).map((k, i) => (
                  <li key={k} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full border-2 border-lime-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 text-lime-600">
                      {i+1}
                    </span>
                    <span className="text-sm text-slate-600">{t(k)}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Cities */}
            {cities.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-bold text-slate-700 mb-3">🗺️ {t('sidebar.cities')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map(c => (
                    <span key={c.id} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
                      {c.name_ar}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI tech */}
            <div className="card-lime p-4">
              <h3 className="text-xs font-bold text-lime-700 mb-2">🤖 AI Technologies Used</h3>
              {[
                'RandomForest Feasibility Model',
                'Solar Irradiance Data Engine',
                'SEC60 AI Advisor Engine',
                'OCR Bill Reading',
                'Financial ROI Simulation',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-lime-500 rounded-full shrink-0" />
                  <span className="text-xs text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">{t('footer')}</p>
      </main>
    </>
  )
}
