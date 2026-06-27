import { motion } from 'framer-motion';
import { Upload, BrainCircuit, FileText, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const steps = [
  { icon: Upload, color: 'from-teal-500 to-teal-600', num: '01' },
  { icon: BrainCircuit, color: 'from-cyan-500 to-cyan-600', num: '02' },
  { icon: FileText, color: 'from-sky-500 to-sky-600', num: '03' },
];

export default function HowItWorks() {
  const { t } = useLanguage();
  const stepData = [
    { title: t.how.step1Title, desc: t.how.step1Desc },
    { title: t.how.step2Title, desc: t.how.step2Desc },
    { title: t.how.step3Title, desc: t.how.step3Desc },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-teal mb-4"
          >
            {t.how.badge}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-heading mt-4"
          >
            {t.how.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="section-subheading mx-auto text-center"
          >
            {t.how.subtitle}
          </motion.p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-teal-200 via-cyan-300 to-sky-200" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative card p-8 text-center hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="relative inline-flex mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-glow`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{stepData[i].title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{stepData[i].desc}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link to="/calculator" className="btn-primary">
            Try It Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
