import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const { t } = useLanguage();
  const plans = [t.pricing.plans.individual, t.pricing.plans.business, t.pricing.plans.enterprise];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-teal mb-4"
          >
            {t.pricing.badge}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-heading mt-4"
          >
            {t.pricing.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="section-subheading mx-auto text-center"
          >
            {t.pricing.subtitle}
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = i === 1;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  isPopular
                    ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-[0_24px_60px_rgba(0,0,0,0.25)]'
                    : 'bg-white border border-slate-100 shadow-card hover:shadow-card-hover'
                }`}
              >
                {'badge' in plan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 shadow-glow-sm px-4">
                      <Zap className="w-3 h-3" />
                      {(plan as typeof t.pricing.plans.business).badge}
                    </span>
                  </div>
                )}

                <div className={`text-sm font-semibold mb-2 ${isPopular ? 'text-teal-400' : 'text-teal-600'}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-8 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isPopular ? 'bg-teal-500/20' : 'bg-teal-50'
                      }`}>
                        <Check className={`w-3 h-3 ${isPopular ? 'text-teal-400' : 'text-teal-600'}`} />
                      </div>
                      <span className={`text-sm ${isPopular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/calculator"
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-200 block ${
                    isPopular
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-glow hover:scale-[1.02]'
                      : 'border border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
