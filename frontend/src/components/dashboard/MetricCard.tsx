import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const colorMap: Record<string, string> = {
  teal: 'text-teal-600 bg-teal-50',
  green: 'text-green-600 bg-green-50',
  sky: 'text-sky-600 bg-sky-50',
  amber: 'text-amber-600 bg-amber-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  purple: 'text-purple-600 bg-purple-50',
  red: 'text-red-600 bg-red-50',
};

interface Props {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  index: number;
}

export default function MetricCard({ title, value, unit, icon: Icon, color, index }: Props) {
  const colors = colorMap[color] || colorMap.teal;
  const [textColor, bgColor] = colors.split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="metric-card"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${textColor}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400">{unit}</p>
    </motion.div>
  );
}
