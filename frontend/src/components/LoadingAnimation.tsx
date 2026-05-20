import { Zap } from 'lucide-react'

const steps = [
  'جارٍ تحميل بيانات الإشعاع الشمسي…',
  'تشغيل نموذج Random Forest…',
  'حساب الجدوى الاقتصادية…',
  'مستشار SEC60 AI يُحلّل النتائج…',
]

export default function LoadingAnimation() {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-8">
      {/* Pulsing logo */}
      <div className="relative">
        <div className="absolute inset-0 bg-lime-500/20 rounded-full animate-ping" />
        <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center shadow-xl shadow-lime-500/40 relative z-10">
          <Zap size={36} className="text-white fill-white" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-navy-900">SEC60</h2>
        <p className="text-slate-500 text-sm mt-1">جارٍ التحليل خلال 60 ثانية…</p>
      </div>
      <div className="space-y-2 w-72">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 0.4}s`, animationFillMode: 'forwards' }}>
            <div className="w-2 h-2 bg-lime-500 rounded-full shrink-0 animate-pulse-slow" />
            <span className="text-sm text-slate-600">{step}</span>
          </div>
        ))}
      </div>
      <div className="w-72 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-lime-500 to-solar-cyan rounded-full"
          style={{ animation: 'loadingBar 3s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes loadingBar{0%{width:0%}50%{width:80%}100%{width:100%}}`}</style>
    </div>
  )
}
