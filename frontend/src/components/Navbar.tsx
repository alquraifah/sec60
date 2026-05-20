import { Zap, Globe } from 'lucide-react'
import { useLang } from '../context/LanguageContext'

export default function Navbar() {
  const { lang, setLang, t } = useLang()

  return (
    <nav className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-lime-500 rounded-xl flex items-center justify-center shadow-lg shadow-lime-500/50">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-navy-900 animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black text-white tracking-tight">
              SEC<span className="text-lime-400">60</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium -mt-0.5">{t('nav.tagline')}</div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-[11px] font-bold text-lime-400/80 bg-lime-500/10 border border-lime-500/20 px-2.5 py-1 rounded-full">
            AI + ML
          </span>

          {/* Language toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {(['ar', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                  lang === l
                    ? 'bg-lime-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {l === 'ar' ? 'ع' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
