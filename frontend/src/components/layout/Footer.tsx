import { Link } from 'react-router-dom';
import { Zap, Sun, Shield, Award } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SEC60</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">{t.footer.tagline}</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 w-fit">
              <Sun className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-teal-400 font-medium">{t.footer.vision}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t.footer.platform}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t.footer.calculator, href: '/calculator' },
                { label: t.footer.dashboard, href: '/dashboard' },
                { label: t.footer.assistant, href: '/assistant' },
                { label: t.footer.report, href: '/report' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t.footer.company}</h4>
            <ul className="space-y-2.5">
              {[t.footer.about, t.footer.pricing, t.footer.contact].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-400 hover:text-teal-400 transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Trusted Ecosystem</h4>
            <div className="space-y-3">
              {[
                { icon: Shield, label: 'Saudi Ministry of Energy' },
                { icon: Award, label: 'KACARE' },
                { icon: Sun, label: 'Vision 2030 Aligned' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">{t.footer.copyright}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              {t.footer.privacy}
            </span>
            <span className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              {t.footer.terms}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
