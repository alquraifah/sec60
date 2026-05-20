import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  unit?: string
  icon: ReactNode
  accent?: 'lime' | 'cyan' | 'amber' | 'navy'
  sublabel?: string
}

const iconBg: Record<string, string> = {
  lime:  'bg-lime-50  border-lime-200  text-lime-600',
  cyan:  'bg-cyan-50  border-cyan-200  text-cyan-600',
  amber: 'bg-amber-50 border-amber-200 text-amber-600',
  navy:  'bg-slate-50 border-slate-200 text-navy-700',
}
const valueColor: Record<string, string> = {
  lime:  'text-lime-600',
  cyan:  'text-cyan-600',
  amber: 'text-amber-600',
  navy:  'text-navy-800',
}

export default function MetricCard({ label, value, unit, icon, accent = 'lime', sublabel }: Props) {
  return (
    <div className="metric-card animate-fade-in">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2 ${iconBg[accent]}`}>
        {icon}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-2xl font-extrabold leading-none ${valueColor[accent]}`}>
          {typeof value === 'number' ? value.toLocaleString('en-US') : value}
        </span>
        {unit && <span className="text-sm text-slate-500 font-medium">{unit}</span>}
      </div>
      <p className="text-sm text-slate-700 font-semibold mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  )
}
