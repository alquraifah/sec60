import { useState, useRef } from 'react'
import { Upload, X, ChevronDown, Zap, AlertCircle } from 'lucide-react'
import type { AnalyzeRequest, FacilityType, SystemType, CityInfo, OCRResult } from '../types'
import { api } from '../services/api'
import { useLang } from '../context/LanguageContext'

interface Props {
  onSubmit: (req: AnalyzeRequest) => void
  onDemoClick: () => void
  loading: boolean
  cities: CityInfo[]
}

export default function InputForm({ onSubmit, onDemoClick, loading, cities }: Props) {
  const { t, lang } = useLang()

  const [city,        setCity]       = useState('')
  const [facility,    setFacility]   = useState<FacilityType>('residential')
  const [systemType,  setSystemType] = useState<SystemType>('grid_tied')
  const [billMode,    setBillMode]   = useState<'sar'|'kwh'>('sar')
  const [billSar,     setBillSar]    = useState('')
  const [billKwh,     setBillKwh]    = useState('')
  const [area,        setArea]       = useState('')
  const [billFile,    setBillFile]   = useState<File|null>(null)
  const [ocrResult,   setOcrResult]  = useState<OCRResult|null>(null)
  const [ocrLoading,  setOcrLoading] = useState(false)
  const [error,       setError]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const FACILITIES: { v: FacilityType; icon: string }[] = [
    { v:'residential', icon:'🏠' }, { v:'commercial', icon:'🏢' },
    { v:'factory',     icon:'🏭' }, { v:'farm',       icon:'🌾' },
    { v:'remote',      icon:'🏔️' },
  ]
  const SYSTEMS: { v: SystemType; icon: string }[] = [
    { v:'grid_tied', icon:'⚡' }, { v:'hybrid', icon:'🔋' }, { v:'off_grid', icon:'🌐' },
  ]

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBillFile(file); setOcrLoading(true)
    try {
      const r = await api.uploadBill(file)
      setOcrResult(r)
      if (r.extracted_kwh) { setBillKwh(String(Math.round(r.extracted_kwh))); setBillMode('kwh') }
      else if (r.extracted_sar) { setBillSar(String(Math.round(r.extracted_sar))); setBillMode('sar') }
    } catch { setOcrResult({ success:false, extracted_kwh:null, extracted_sar:null, confidence:0, error:'فشل رفع الملف' }) }
    finally { setOcrLoading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!city) { setError('الرجاء اختيار المدينة'); return }
    if (billMode==='sar' && !billSar) { setError('الرجاء إدخال قيمة الفاتورة'); return }
    if (billMode==='kwh' && !billKwh) { setError('الرجاء إدخال الاستهلاك'); return }
    onSubmit({
      city, facility_type: facility, system_type: systemType,
      monthly_bill_sar: billMode==='sar' && billSar ? parseFloat(billSar) : undefined,
      monthly_consumption_kwh: billMode==='kwh' && billKwh ? parseFloat(billKwh) : undefined,
      area_sqm: area ? parseFloat(area) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* City */}
      <div>
        <label className="label-text">📍 {t('form.city')}</label>
        <div className="relative">
          <select value={city} onChange={e => setCity(e.target.value)} className="select-field pr-4 pl-10" required>
            <option value="">{t('form.city.ph')}</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>
                {lang==='ar' ? c.name_ar : c.name_en} — {c.peak_sun_hours} {t('form.psh.suffix')}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Facility */}
      <div>
        <label className="label-text">🏗️ {t('form.facility')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FACILITIES.map(({ v, icon }) => (
            <button key={v} type="button" onClick={() => setFacility(v)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                facility===v
                  ? 'bg-lime-50 border-lime-400 text-lime-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-lime-300 hover:text-slate-800'
              }`}>
              <span>{icon}</span><span>{t(`facility.${v}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bill */}
      <div>
        <label className="label-text">💡 {t('form.bill')}</label>
        <div className="flex mb-2.5 bg-slate-100 rounded-xl p-1 gap-1">
          {(['sar','kwh'] as const).map(m => (
            <button key={m} type="button" onClick={() => setBillMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                billMode===m ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {t(`form.bill.${m}`)}
            </button>
          ))}
        </div>
        {billMode==='sar'
          ? <div className="relative"><input type="number" value={billSar} onChange={e=>setBillSar(e.target.value)} placeholder="500" min="1" className="input-field pl-20" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">ريال/شهر</span></div>
          : <div className="relative"><input type="number" value={billKwh} onChange={e=>setBillKwh(e.target.value)} placeholder="1500" min="1" className="input-field pl-24" /><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">كيلوواط·ساعة</span></div>
        }
        {ocrResult && (
          <div className={`mt-2 flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${ocrResult.success ? 'bg-lime-50 border-lime-200 text-lime-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            {ocrResult.success ? `تم استخراج القيم (ثقة: ${Math.round(ocrResult.confidence*100)}٪) — تحقق منها` : (ocrResult.error||'فشل الاستخراج')}
          </div>
        )}
      </div>

      {/* Area */}
      <div>
        <label className="label-text">📐 {t('form.area')}</label>
        <div className="relative">
          <input type="number" value={area} onChange={e=>setArea(e.target.value)} placeholder={t('form.area.ph')} min="1" className="input-field pl-10" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">م²</span>
        </div>
      </div>

      {/* System type */}
      <div>
        <label className="label-text">⚙️ {t('form.system')}</label>
        <div className="space-y-2">
          {SYSTEMS.map(({ v, icon }) => (
            <button key={v} type="button" onClick={() => setSystemType(v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                systemType===v
                  ? 'bg-lime-50 border-lime-400 text-navy-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-lime-300'
              }`}>
              <div className="flex items-center gap-2.5">
                <span>{icon}</span>
                <span className="font-semibold">{t(`system.${v}`)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{t(`system.${v}.desc`)}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${systemType===v ? 'border-lime-500 bg-lime-500' : 'border-slate-300'}`}>
                  {systemType===v && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="label-text">📄 {t('form.upload')}</label>
        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-200 hover:border-lime-400 rounded-xl p-4 cursor-pointer transition-all group bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-lime-50 border border-slate-200 group-hover:border-lime-200">
              <Upload size={18} className="text-slate-400 group-hover:text-lime-500 transition-colors" />
            </div>
            {billFile ? (
              <div className="flex-1 flex items-center justify-between">
                <button type="button" onClick={e=>{e.stopPropagation();setBillFile(null);setOcrResult(null)}} className="text-red-400 hover:text-red-500"><X size={16}/></button>
                <div className="text-right">
                  <p className="text-sm text-slate-700 font-medium">{billFile.name}</p>
                  <p className="text-xs text-slate-400">{ocrLoading ? 'جارٍ الاستخراج…' : 'تم الرفع'}</p>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-sm text-slate-500">اسحب أو انقر للاختيار</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG، JPG، PDF (حتى 10 MB)</p>
              </div>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={handleFile} />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle size={15} /><span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
          <Zap size={18} className="fill-white" />
          {loading ? 'جارٍ التحليل…' : t('form.analyze')}
        </button>
        <button type="button" onClick={onDemoClick} className="btn-secondary w-full text-sm">
          {t('form.demo')}
        </button>
      </div>
    </form>
  )
}
