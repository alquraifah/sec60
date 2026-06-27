import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

interface Props {
  data: { year: number; savings: number; cumulative: number }[];
  paybackYears: number;
}

export default function CashFlowChart({ data, paybackYears }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="card p-6"
    >
      <h3 className="text-sm font-semibold text-slate-800 mb-4">25-Year Financial Projection</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} SAR`, '']}
              labelFormatter={(label) => `Year ${label}`}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            {paybackYears <= 25 && (
              <ReferenceLine
                x={Math.ceil(paybackYears)}
                stroke="#06b6d4"
                strokeDasharray="5 5"
                label={{ value: 'Payback', position: 'top', fontSize: 10, fill: '#06b6d4' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fill="url(#colorCumulative)"
              name="Cumulative Savings"
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray="4 4"
              name="Annual Savings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
