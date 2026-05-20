import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, AlertTriangle, CheckCircle2, ArrowLeft, Cpu } from 'lucide-react'
import type { AIExplanation } from '../types'
import { useLang } from '../context/LanguageContext'

interface Props { explanation: AIExplanation }

export default function AIAssistant({ explanation }: Props) {
  const [open, setOpen] = useState(true)
  const { t } = useLang()

  return (
    <div className="card-cyan p-5 animate-slide-up">
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center">
            <Sparkles size={18} className="text-solar-cyan" />
          </div>
          <div className={useLang().isRTL ? 'text-right' : 'text-left'}>
            <p className="text-navy-900 font-bold text-sm">{t('ai.title')}</p>
            <p className="text-slate-500 text-xs">{t('ai.subtitle')}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {/* AI badge */}
      <div className="mt-3 flex items-center gap-1.5 bg-lime-50 border border-lime-200 rounded-lg px-3 py-2">
        <Cpu size={13} className="text-lime-600 shrink-0" />
        <span className="text-xs font-semibold text-lime-700">{t('results.ai.badge')}</span>
      </div>

      {open && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Positioning — replaces disclaimers */}
          <div className="bg-lime-50 border border-lime-200 rounded-xl px-4 py-3">
            <p className="text-lime-800 text-xs font-semibold leading-5">{t('ai.positioning')}</p>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-slate-700 text-sm leading-7">{explanation.summary_ar}</p>
          </div>

          {/* Positive factors */}
          {explanation.reasons_ar.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-lime-600" />
                <span className="text-lime-700 text-xs font-bold">{t('ai.positive')}</span>
              </div>
              <ul className="space-y-1.5">
                {explanation.reasons_ar.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-6 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-lime-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {explanation.risks_ar.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-amber-700 text-xs font-bold">{t('ai.risks')}</span>
              </div>
              <ul className="space-y-1.5">
                {explanation.risks_ar.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-6">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowLeft size={14} className="text-solar-cyan" />
              <span className="text-cyan-700 text-xs font-bold">{t('ai.steps')}</span>
            </div>
            <ul className="space-y-2">
              {explanation.next_steps_ar.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-solar-cyan text-xs font-bold mt-0.5 shrink-0 w-4">{i + 1}</span>
                  <span className="text-sm text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
