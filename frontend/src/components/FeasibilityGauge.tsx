interface Props {
  score: number
  label: string
  color: 'green' | 'lime' | 'yellow' | 'orange' | 'red'
}

const palette = {
  green:  { stroke: '#16a34a', glow: 'rgba(22,163,74,0.35)',  text: '#15803d', bg: 'bg-green-50  border-green-200  text-green-800' },
  lime:   { stroke: '#84cc16', glow: 'rgba(132,204,22,0.35)', text: '#4d7c0f', bg: 'bg-lime-50   border-lime-200   text-lime-800'  },
  yellow: { stroke: '#eab308', glow: 'rgba(234,179,8,0.35)',  text: '#a16207', bg: 'bg-yellow-50 border-yellow-200 text-yellow-800'},
  orange: { stroke: '#f97316', glow: 'rgba(249,115,22,0.35)', text: '#c2410c', bg: 'bg-orange-50 border-orange-200 text-orange-800'},
  red:    { stroke: '#ef4444', glow: 'rgba(239,68,68,0.35)',  text: '#b91c1c', bg: 'bg-red-50    border-red-200    text-red-800'   },
}

export default function FeasibilityGauge({ score, label, color }: Props) {
  const c = palette[color] ?? palette.lime
  const R = 54
  const circ = 2 * Math.PI * R
  const progress = Math.max(0, Math.min(1, score / 100))

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle cx="60" cy="60" r={R} fill="none"
            stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          />
          {/* Progress */}
          <circle cx="60" cy="60" r={R} fill="none"
            stroke={c.stroke} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${circ * 0.75 * progress} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${c.glow})`, transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        {/* Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color: c.stroke }}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-slate-400 font-medium">/ 100</span>
        </div>
      </div>

      {/* Label pill */}
      <div className={`px-5 py-1.5 rounded-full text-sm font-bold border ${c.bg}`}>
        {label}
      </div>
      <p className="text-xs text-slate-500">مؤشر الجدوى الاقتصادية</p>
    </div>
  )
}
