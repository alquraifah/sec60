import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, Zap } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CalculatorForm from '../components/calculator/CalculatorForm';
import { useLanguage } from '../context/LanguageContext';

export default function Calculator() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <span className="badge-teal mb-4">
              <BrainCircuit className="w-3 h-3" />
              {t.calc.badge}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-3">{t.calc.title}</h1>
            <p className="text-slate-500">{t.calc.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4 mb-8"
          >
            <Zap className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-teal-800">AI-Powered Analysis</p>
              <p className="text-xs text-teal-600 mt-0.5">
                Your data is sent to our FastAPI backend for real-time solar feasibility calculations using Saudi solar irradiance data and financial modeling.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <CalculatorForm onComplete={() => navigate('/dashboard')} />
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
