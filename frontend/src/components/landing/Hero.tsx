import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Zap, Shield, Clock, Target } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useCountUp } from '../../hooks/useCountUp';

function AnimatedStat({ value, suffix, label, icon: Icon }: {
  value: number; suffix: string; label: string; icon: React.ElementType;
}) {
  const count = useCountUp(value, 2000);
  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-card px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-teal-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-slate-900 leading-none">{count}{suffix}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50 via-cyan-50/50 to-transparent rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-50/40 to-transparent rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(#14b8a6 1px, transparent 1px), linear-gradient(90deg, #14b8a6 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="badge-teal mb-6">
                <Zap className="w-3 h-3" />
                {t.hero.badge}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight text-balance"
            >
              {t.hero.headline.split('60')[0]}
              <span className="gradient-text">60 Seconds</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-slate-500 leading-relaxed max-w-xl"
            >
              {t.hero.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/calculator" className="btn-primary">
                {t.hero.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="btn-secondary">
                <Play className="w-4 h-4" />
                {t.hero.ctaSecondary}
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-6 text-xs text-slate-400"
            >
              {t.hero.trusted}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 grid grid-cols-2 gap-3"
            >
              <AnimatedStat value={60} suffix="s" label={t.stats.timeLabel} icon={Clock} />
              <AnimatedStat value={99} suffix=".1%" label={t.stats.sizingR2Label} icon={Shield} />
              <AnimatedStat value={98} suffix=".2%" label={t.stats.feasibilityR2Label} icon={Target} />
              <AnimatedStat value={1} suffix=".91" label={t.stats.feasibilityMAELabel} icon={Zap} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-3xl blur-3xl" />
      <div className="relative bg-white rounded-3xl border border-slate-100 shadow-[0_32px_80px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-xs text-slate-400 border border-slate-200">
            sec60.ai/dashboard
          </div>
        </div>
        <div className="p-6 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">AI Analysis Complete</div>
              <div className="text-sm font-semibold text-slate-800">Solar Feasibility Report</div>
            </div>
            <div className="badge-teal text-xs">Score: 87/100</div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Annual Savings', value: '48,600', unit: 'SAR', color: 'text-teal-600' },
              { label: 'ROI', value: '210', unit: '%', color: 'text-green-600' },
              { label: 'Payback Period', value: '5.8', unit: 'years', color: 'text-sky-600' },
              { label: 'CO₂ Saved', value: '24.8', unit: 'tons/yr', color: 'text-emerald-600' },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl p-3 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                <div className={`text-lg font-bold ${m.color}`}>
                  {m.value} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <div className="text-xs text-slate-500 mb-3">25-Year Cash Flow</div>
            <div className="flex items-end gap-1 h-16">
              {[20, 35, 48, 58, 70, 80, 90, 98, 105, 112].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: 'linear-gradient(to top, #14b8a6, #06b6d4)',
                    opacity: 0.6 + i * 0.04,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 bg-white rounded-xl shadow-card-hover px-4 py-2.5 border border-teal-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">AI Analysis Ready</span>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-card-hover px-4 py-2.5 border border-cyan-100"
      >
        <div className="text-xs font-semibold text-slate-700">⚡ 48 sec analysis</div>
      </motion.div>
    </div>
  );
}
