/**
 * ApiStatusBanner — polls /health every 10 s and shows:
 *   • Checking…  (neutral, on first render)
 *   • Online     (green pill — compact)
 *   • Offline    (red card with exact terminal commands to fix)
 */
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, WifiOff, Loader2, Terminal, RefreshCw } from 'lucide-react';
import { checkBackendHealth, API_BASE_URL } from '../lib/api';

type Status = 'checking' | 'online' | 'offline';

interface Props {
  onStatusChange?: (online: boolean) => void;
}

export default function ApiStatusBanner({ onStatusChange }: Props) {
  const [status, setStatus]   = useState<Status>('checking');
  const [retrying, setRetrying] = useState(false);

  const check = useCallback(async () => {
    const ok = await checkBackendHealth();
    setStatus(ok ? 'online' : 'offline');
    onStatusChange?.(ok);
    setRetrying(false);
  }, [onStatusChange]);

  useEffect(() => {
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [check]);

  const handleRetry = () => {
    setRetrying(true);
    setStatus('checking');
    check();
  };

  // ── Online ──────────────────────────────────────────────────────────────────
  if (status === 'online') {
    return (
      <div className="flex justify-center mb-5">
        <span className="inline-flex items-center gap-1.5 bg-lime-50 border border-lime-300 text-lime-700 rounded-full px-3 py-1 text-xs font-semibold">
          <CheckCircle2 size={12} />
          الخادم متصل — Backend online ({API_BASE_URL})
        </span>
      </div>
    );
  }

  // ── Checking ────────────────────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="flex justify-center mb-5">
        <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-500 rounded-full px-3 py-1 text-xs font-medium">
          <Loader2 size={12} className="animate-spin" />
          جارٍ التحقق من الاتصال… | Connecting…
        </span>
      </div>
    );
  }

  // ── Offline ─────────────────────────────────────────────────────────────────
  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
          <WifiOff size={18} className="text-red-600" />
        </div>
        <div>
          <p className="font-bold text-red-800 text-sm leading-snug">
            Backend API is not running. Please start the FastAPI server on{' '}
            <a
              href={`${API_BASE_URL}/health`}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-red-900"
            >
              {API_BASE_URL}
            </a>
          </p>
          <p className="text-red-600 text-xs mt-1">
            الخادم غير متصل — يحاول الاتصال بـ:{' '}
            <code className="font-mono bg-red-100 px-1 rounded">{API_BASE_URL}</code>
          </p>
        </div>
      </div>

      {/* Fix instructions */}
      <div className="bg-white rounded-xl border border-red-100 mb-4 overflow-hidden divide-y divide-slate-100">
        {/* Step 1 */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Terminal size={11} className="text-slate-500" />
            Run this in a new terminal window:
          </p>
          <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-2.5 overflow-x-auto font-mono leading-relaxed">
{`cd C:\\Users\\shouq\\sec60\\backend
venv\\Scripts\\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000`}
          </pre>
        </div>

        {/* Step 2 */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-slate-500" />
            Verify the backend is running — open this URL:
          </p>
          <a
            href={`${API_BASE_URL}/health`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-blue-600 underline hover:text-blue-800"
          >
            {API_BASE_URL}/health
          </a>
          <span className="text-xs text-slate-400 ml-2">
            — should return: <code className="font-mono">{`{"status":"ok"}`}</code>
          </span>
        </div>

        {/* Wrong port */}
        <div className="px-4 py-3">
          <p className="text-xs font-bold text-slate-700 mb-1">If your backend runs on a different port:</p>
          <p className="text-xs text-slate-500 mb-1">
            Edit <code className="font-mono bg-slate-100 px-1 rounded">frontend/.env</code>:
          </p>
          <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-1.5 font-mono">
            VITE_API_BASE_URL=http://localhost:YOUR_PORT
          </pre>
          <p className="text-xs text-slate-400 mt-1">
            Then restart: <code className="font-mono">npm run dev</code>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          💡 Click <strong className="text-slate-700">"تجربة النظام"</strong> below to preview the app without the backend.
        </p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
          Retry / إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
