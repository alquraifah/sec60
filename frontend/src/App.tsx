import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Home from './pages/Home'
import Results from './pages/Results'

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/"       element={<Home />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </LanguageProvider>
  )
}
