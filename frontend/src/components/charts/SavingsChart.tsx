import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import type { YearlySavings } from '../../types'

interface Props { data: YearlySavings[]; installationCost: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const cum = payload.find((p: any) => p.dataKey === 'cumulative')?.value ?? 0
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-right shadow-lg">
      <p className="text-slate-400 text-xs mb-1">السنة {label}</p>
      <p className={`text-sm font-bold ${cum >= 0 ? 'text-lime-600' : 'text-red-500'}`}>
        {cum >= 0 ? '+' : ''}{cum.toLocaleString()} SAR
      </p>
    </div>
  )
}

export default function SavingsChart({ data, installationCost }: Props) {
  return (
    <div className="w-full h-60">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top:10, right:10, left:10, bottom:0 }}>
          <defs>
            <linearGradient id="posG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#84cc16" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#84cc16" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="year" tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} label={{ value:'Year', position:'insideBottom', fill:'#94a3b8', fontSize:10, dy:10 }}/>
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} width={48}/>
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
          <ReferenceLine y={-installationCost} stroke="#06b6d4" strokeDasharray="4 2" label={{ value:'Initial Cost', fill:'#06b6d4', fontSize:9, position:'right' }}/>
          <Area type="monotone" dataKey="cumulative" stroke="#84cc16" strokeWidth={2.5} fill="url(#posG)" dot={false} activeDot={{ r:5, fill:'#84cc16', stroke:'white', strokeWidth:2 }} name="Cumulative (SAR)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
