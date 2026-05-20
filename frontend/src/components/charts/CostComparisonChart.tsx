import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { YearlySavings } from '../../types'

interface Props { savingsByYear: YearlySavings[]; annualBillSar: number; installationCost: number }

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-slate-400 text-xs mb-2">Year {label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm font-semibold">
          {p.name}: {p.value?.toLocaleString()} SAR
        </p>
      ))}
    </div>
  )
}

export default function CostComparisonChart({ savingsByYear, annualBillSar, installationCost }: Props) {
  let tradCum = 0, solarCum = installationCost
  const data = savingsByYear.slice(0,12).map(y => {
    tradCum  += annualBillSar
    solarCum += annualBillSar - y.savings
    return { year: y.year, 'Traditional Grid': Math.round(tradCum), 'Solar System': Math.round(solarCum) }
  })
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top:10, right:10, left:5, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
          <XAxis dataKey="year" tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} label={{ value:'Year', position:'insideBottom', fill:'#94a3b8', fontSize:10, dy:10 }}/>
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} width={44}/>
          <Tooltip content={<Tip />}/>
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12, color:'#64748b', paddingTop:8 }}/>
          <Line type="monotone" dataKey="Traditional Grid" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r:5 }}/>
          <Line type="monotone" dataKey="Solar System"     stroke="#84cc16" strokeWidth={2.5} dot={false} activeDot={{ r:5 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
