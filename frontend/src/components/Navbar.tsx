import { Zap } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()

  return (
    <nav className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/40">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="leading-none">
            <span className="text-xl font-extrabold text-white tracking-tight">
              SEC<span className="text-lime-400">60</span>
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">{t('nav.tagline')}</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* AI badge */}
          <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-lime-500/15 border border-lime-500/30 rounded-full text-lime-400 text-[11px] font-semibold">
            {t('nav.badge')}
          </span>

          {/* Language toggle */}
          <div className="flex bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setLang('ar')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                lang === 'ar'
                  ? 'bg-lime-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ع
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                lang === 'en'
                  ? 'bg-lime-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
