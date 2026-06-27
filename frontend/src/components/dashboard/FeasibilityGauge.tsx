import { motion } from 'framer-motion';

interface Props {
  score: number;
  label: string;
}

export default function FeasibilityGauge({ score, label }: Props) {
  const getColor = () => {
    if (score >= 80) return { ring: 'text-green-500', bg: 'bg-green-50', label: 'text-green-700' };
    if (score >= 65) return { ring: 'text-teal-500', bg: 'bg-teal-50', label: 'text-teal-700' };
    if (score >= 45) return { ring: 'text-amber-500', bg: 'bg-amber-50', label: 'text-amber-700' };
    return { ring: 'text-red-500', bg: 'bg-red-50', label: 'text-red-700' };
  };

  const colors = getColor();
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`card p-6 flex flex-col items-center justify-center ${colors.bg}`}
    >
      <p className="text-xs font-medium text-slate-500 mb-3">Feasibility Score</p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            className={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${colors.ring}`}>{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <span className={`mt-3 badge ${colors.bg} ${colors.label} border-0`}>
        {label}
      </span>
    </motion.div>
  );
}
