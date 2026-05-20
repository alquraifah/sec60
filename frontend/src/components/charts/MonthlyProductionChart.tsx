import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface Props { data: number[] }

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-lime-600 text-sm font-bold">{payload[0].value.toLocaleString()} kWh</p>
    </div>
  )
}

export default function MonthlyProductionChart({ data }: Props) {
  const max = Math.max(...data)
  const chartData = data.map((v, i) => ({ month: MONTHS[i], kwh: v }))
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top:10, right:10, left:5, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false}/>
          <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} tickLine={false} axisLine={false}/>
          <YAxis tickFormatter={v => `${(v/1000).toFixed(1)}K`} tick={{ fill:'#64748b', fontSize:11 }} tickLine={false} axisLine={false} width={42}/>
          <Tooltip content={<Tip />} cursor={{ fill:'rgba(0,0,0,0.04)' }}/>
          <Bar dataKey="kwh" radius={[4,4,0,0]}>
            {chartData.map((e, i) => <Cell key={i} fill={e.kwh >= max*0.92 ? '#84cc16' : '#06b6d4'} opacity={0.85}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
