import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAnalysis } from '../../context/AnalysisContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const knowledgeBase: Record<string, { en: string; ar: string }> = {
  feasib: {
    en: "Based on the analysis, the project shows strong financial feasibility. Saudi Arabia has exceptional solar irradiance (5.5-6.4 peak sun hours daily), making it one of the best regions globally for solar energy. The key factors are your location's solar potential, current electricity tariff, and system size. Projects with payback periods under 7 years are considered highly feasible.",
    ar: "بناءً على التحليل، يُظهر المشروع جدوى مالية قوية. تتمتع المملكة العربية السعودية بإشعاع شمسي استثنائي (5.5-6.4 ساعة ذروة يومياً)، مما يجعلها من أفضل المناطق عالمياً للطاقة الشمسية. العوامل الرئيسية هي الإمكانية الشمسية لموقعك وتعريفة الكهرباء الحالية وحجم النظام.",
  },
  payback: {
    en: "The payback period represents how long it takes for the accumulated energy savings to equal the initial investment. In Saudi Arabia, typical solar payback periods range from 4-12 years depending on facility type and electricity tariff. Farms and remote sites often see faster payback due to higher tariffs or diesel replacement savings.",
    ar: "تمثل فترة الاسترداد المدة التي تستغرقها المدخرات المتراكمة لتساوي الاستثمار الأولي. في السعودية، تتراوح فترات الاسترداد النموذجية بين 4-12 سنة حسب نوع المنشأة وتعريفة الكهرباء. المزارع والمواقع النائية غالباً ما تحقق استرداداً أسرع.",
  },
  panels: {
    en: "The number of solar panels depends on your energy consumption and available space. We use high-efficiency 550W monocrystalline panels, each covering approximately 2.4 m². The system is sized to offset your electricity consumption while considering available roof/land area. A typical Saudi residential system uses 10-30 panels, while commercial and farm installations may need 50-500+ panels.",
    ar: "يعتمد عدد الألواح الشمسية على استهلاكك للطاقة والمساحة المتاحة. نستخدم ألواحاً أحادية البلورة عالية الكفاءة بقدرة 550 واط، تغطي كل منها حوالي 2.4 م². يتم تحديد حجم النظام لتعويض استهلاكك الكهربائي مع مراعاة مساحة السقف/الأرض المتاحة.",
  },
  financ: {
    en: "Several financing options are available for solar projects in Saudi Arabia: 1) Direct purchase with your own capital for maximum ROI. 2) Bank financing through green energy loans offered by Saudi banks. 3) Power Purchase Agreements (PPAs) where a developer installs and maintains the system. 4) Government incentives through REPDO and Vision 2030 renewable energy programs.",
    ar: "تتوفر عدة خيارات تمويل لمشاريع الطاقة الشمسية في السعودية: 1) الشراء المباشر لتحقيق أقصى عائد. 2) التمويل البنكي عبر قروض الطاقة الخضراء. 3) اتفاقيات شراء الطاقة حيث يقوم المطور بالتركيب والصيانة. 4) حوافز حكومية من خلال برامج الطاقة المتجددة ورؤية 2030.",
  },
  vision: {
    en: "Saudi Vision 2030 targets 50% of energy from renewable sources by 2030. This has created significant incentives for solar adoption including: streamlined permitting, net metering regulations allowing grid feed-in, REPDO's renewable energy procurement program, and growing private sector investment. Solar projects directly support Vision 2030's sustainability and economic diversification goals.",
    ar: "تستهدف رؤية 2030 أن تكون 50٪ من الطاقة من مصادر متجددة. وقد أوجد ذلك حوافز كبيرة لتبني الطاقة الشمسية تشمل: تسهيل إجراءات التصاريح، أنظمة صافي القياس، برنامج REPDO لشراء الطاقة المتجددة، ونمو استثمارات القطاع الخاص.",
  },
  farm: {
    en: "Solar energy is particularly beneficial for farms in Saudi Arabia. Benefits include: reduced irrigation pump operating costs (diesel or electric), reliable off-grid power for remote agricultural areas, potential for agrivoltaics (farming under solar panels), and significant reduction in operational expenses. Farm tariffs are typically 0.10 SAR/kWh, and solar can dramatically reduce or eliminate this cost.",
    ar: "الطاقة الشمسية مفيدة بشكل خاص للمزارع في السعودية. تشمل الفوائد: خفض تكاليف تشغيل مضخات الري، طاقة موثوقة للمناطق الزراعية النائية، إمكانية الزراعة تحت الألواح الشمسية، وتخفيض كبير في المصاريف التشغيلية. تعريفة المزارع عادة 0.10 ريال/كيلوواط ساعة.",
  },
};

function findAnswer(query: string, lang: 'en' | 'ar'): string {
  const q = query.toLowerCase();
  for (const [key, val] of Object.entries(knowledgeBase)) {
    if (q.includes(key.slice(0, 4))) return val[lang];
  }
  if (q.includes('roi') || q.includes('return') || q.includes('عائد')) return knowledgeBase.feasib[lang];
  if (q.includes('pay') || q.includes('استرداد')) return knowledgeBase.payback[lang];
  if (q.includes('panel') || q.includes('لوح') || q.includes('ألواح')) return knowledgeBase.panels[lang];
  if (q.includes('financ') || q.includes('loan') || q.includes('تمويل')) return knowledgeBase.financ[lang];
  if (q.includes('2030') || q.includes('vision') || q.includes('رؤية')) return knowledgeBase.vision[lang];
  if (q.includes('farm') || q.includes('مزرع')) return knowledgeBase.farm[lang];

  return lang === 'ar'
    ? 'شكراً لسؤالك! بناءً على تحليلنا للبيانات الشمسية في السعودية، يمكنني مساعدتك في فهم جدوى مشروعك. يرجى السؤال عن موضوع محدد مثل فترة الاسترداد أو عدد الألواح أو خيارات التمويل.'
    : "Thanks for your question! Based on our Saudi solar data analysis, I can help you understand your project's feasibility. Please ask about a specific topic like payback period, panel count, financing options, or Vision 2030 impact.";
}

export default function AIAssistant() {
  const { t, lang } = useLanguage();
  const { result } = useAnalysis();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.assistant.welcome },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || thinking) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setThinking(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    let answer = findAnswer(userMsg, lang);

    if (result) {
      const contextLine = lang === 'ar'
        ? `\n\nبيانات تحليلك: حجم النظام ${result.system.actual_kw} كيلوواط، ${result.system.num_panels} لوح، توفير سنوي ${result.financial.annual_savings_sar.toLocaleString()} ريال، فترة الاسترداد ${result.financial.payback_years} سنة.`
        : `\n\nYour analysis data: ${result.system.actual_kw} kW system, ${result.system.num_panels} panels, ${result.financial.annual_savings_sar.toLocaleString()} SAR annual savings, ${result.financial.payback_years} year payback.`;
      answer += contextLine;
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    setThinking(false);
  };

  const handleSuggestion = (s: string) => {
    setInput(s);
  };

  return (
    <div className="card overflow-hidden flex flex-col" style={{ height: '70vh', minHeight: '500px' }}>
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">SEC60 AI Assistant</h3>
            <p className="text-xs text-slate-500">Template-based responses · LLM-ready architecture</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                  : 'bg-slate-50 text-slate-700 border border-slate-100'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
            )}
          </motion.div>
        ))}

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              <span className="text-sm text-slate-500">{t.assistant.thinking}</span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-400 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {t.assistant.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.assistant.placeholder}
            className="input-field flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking}
            className="btn-primary px-4 py-3 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
