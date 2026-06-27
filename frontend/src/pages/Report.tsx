import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ReportPreview from '../components/report/ReportPreview';
import { useAnalysis } from '../context/AnalysisContext';
import { useLanguage } from '../context/LanguageContext';

export default function Report() {
  const { result } = useAnalysis();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!result) navigate('/calculator');
  }, [result, navigate]);

  if (!result) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Link to="/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="badge-teal">
                <FileText className="w-3 h-3" />
                {t.report.badge}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.report.title}</h1>
            <p className="text-slate-500">{t.report.subtitle}</p>
          </motion.div>

          <ReportPreview />
        </div>
      </main>
      <Footer />
    </>
  );
}
