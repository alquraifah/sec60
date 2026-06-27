import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import { AnalysisProvider } from './context/AnalysisContext';
import Landing from './pages/Landing';
import Calculator from './pages/Calculator';
import Dashboard from './pages/Dashboard';
import AssistantPage from './pages/Assistant';
import Report from './pages/Report';

export default function App() {
  return (
    <LanguageProvider>
      <AnalysisProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </AnimatePresence>
      </AnalysisProvider>
    </LanguageProvider>
  );
}
