import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AIAssistant from '../components/assistant/AIAssistant';
import { useLanguage } from '../context/LanguageContext';

export default function AssistantPage() {
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <span className="badge-teal mb-4">
              <Sparkles className="w-3 h-3" />
              {t.assistant.badge}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-4 mb-3">{t.assistant.title}</h1>
            <p className="text-slate-500">{t.assistant.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <AIAssistant />
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
