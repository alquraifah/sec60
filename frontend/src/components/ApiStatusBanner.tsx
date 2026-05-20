/**
 * ApiStatusBanner
 * Polls /health every 15 s and shows the current connection state.
 * The offline message adapts to local-dev vs deployed (Vercel + Render).
 */
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, WifiOff, Loader2, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { checkBackendHealth, API_BASE_URL } from '../lib/api';

type Status = 'checking' | 'online' | 'offline';

interface Props {
  onStatusChange?: (online: boolean) => void;
}

// Detect whether the app is running locally or deployed
const isLocal =
  API_BASE_URL.includes('localhost') ||
  API_BASE_URL.includes('127.0.0.1') ||
  API_BASE_URL === '';

const isMissingEnvVar = API_BASE_URL === '';

export default function ApiStatusBanner({ onStatusChange }: Props) {
  const [status,   setStatus]   = useState<Status>('checking');
  const [retrying, setRetrying] = useState(false);

  const check = useCallback(async () => {
    const ok = await checkBackendHealth();
    setStatus(ok ? 'online' : 'offline');
    onStatusChange?.(ok);
    setRetrying(false);
  }, [onStatusChange]);

  useEffect(() => {
    check();
    const id = setInterval(check, 15_000);   // poll every 15 s
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
          الخادم متصل — Backend online
          <code className="font-mono bg-lime-100 px-1.5 rounded ml-1">{API_BASE_URL}</code>
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
          {isMissingEnvVar
            ? 'VITE_API_BASE_URL is not set…'
            : `Connecting to ${API_BASE_URL}…`}
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
          {isMissingEnvVar ? (
            <>
              <p className="font-bold text-red-800 text-sm">
                <code className="font-mono">VITE_API_BASE_URL</code> is not configured
              </p>
              <p className="text-red-600 text-xs mt-1">
                The app doesn't know where the backend is. Set the variable and redeploy.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-red-800 text-sm">
                Backend not reachable at{' '}
                <a
                  href={`${API_BASE_URL}/health`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-red-900 inline-flex items-center gap-0.5"
                >
                  {API_BASE_URL}
                  <ExternalLink size={10} />
                </a>
              </p>
              <p className="text-red-600 text-xs mt-1">
                الخادم غير متصل — يحاول الاتصال بـ:{' '}
                <code className="font-mono bg-red-100 px-1 rounded">{API_BASE_URL}/health</code>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Instructions — adapt to local-dev vs deployed */}
      <div className="bg-white rounded-xl border border-red-100 mb-4 overflow-hidden divide-y divide-slate-100 text-sm">

        {isMissingEnvVar && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
              <AlertTriangle size={12} /> VITE_API_BASE_URL is empty
            </p>
            <p className="text-xs text-amber-700">
              <strong>Deployed (Vercel):</strong> Go to{' '}
              <strong>Vercel → Project → Settings → Environment Variables</strong> and add:
            </p>
            <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-1.5 mt-1.5 font-mono">
              VITE_API_BASE_URL=https://sec60.onrender.com
            </pre>
            <p className="text-xs text-amber-600 mt-1">
              After saving, click <strong>Redeploy</strong> — Vite bakes the URL into the build.
            </p>
            <p className="text-xs text-amber-700 mt-2">
              <strong>Local dev:</strong> add to{' '}
              <code className="font-mono bg-amber-100 px-1 rounded">frontend/.env</code>:
            </p>
            <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-1.5 mt-1 font-mono">
              VITE_API_BASE_URL=http://localhost:8000
            </pre>
          </div>
        )}

        {isLocal && !isMissingEnvVar && (
          <div className="px-4 py-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Start the backend server:</p>
            <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-2.5 overflow-x-auto font-mono leading-relaxed">
{`cd sec60/backend
venv\\Scripts\\activate          # Windows
# source venv/bin/activate      # Mac / Linux
uvicorn main:app --reload --host 0.0.0.0 --port 8000`}
            </pre>
          </div>
        )}

        {!isLocal && !isMissingEnvVar && (
          <>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-slate-700 mb-1">
                1. Check your Render service is running:
              </p>
              <a
                href={`${API_BASE_URL}/health`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 underline font-mono hover:text-blue-800"
              >
                {API_BASE_URL}/health <ExternalLink size={10} />
              </a>
              <span className="text-xs text-slate-400 ml-2">
                — must return <code className="font-mono">{`{"status":"ok"}`}</code>
              </span>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-slate-700 mb-1">
                2. Verify CORS allows your Vercel domain:
              </p>
              <p className="text-xs text-slate-500">
                In <code className="font-mono bg-slate-100 px-1 rounded">backend/main.py</code>, add your
                Vercel URL to <code className="font-mono bg-slate-100 px-1 rounded">ALLOWED_ORIGINS</code>.
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-slate-700 mb-1">
                3. Verify the Vercel env var is set correctly:
              </p>
              <p className="text-xs text-slate-500 mb-1">
                Vercel → Project → Settings → Environment Variables:
              </p>
              <pre className="bg-slate-900 text-lime-400 text-[11px] rounded-lg px-3 py-1.5 font-mono">
                VITE_API_BASE_URL={API_BASE_URL}
              </pre>
              <p className="text-xs text-red-500 mt-1">
                ⚠️ After changing this variable, you must trigger a new Vercel deployment.
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-slate-700 mb-1">
                4. Render free tier sleeps after inactivity:
              </p>
              <p className="text-xs text-slate-500">
                The first request after sleep takes 30–60 s to wake up. Click Retry below — the banner
                will turn green once the backend is warm.
              </p>
            </div>
          </>
        )}

        {/* Verify link — shown for all non-missing cases */}
        {!isMissingEnvVar && (
          <div className="px-4 py-3 bg-slate-50">
            <p className="text-xs text-slate-500">
              Open in browser to verify:{' '}
              <a
                href={`${API_BASE_URL}/health`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-blue-600 underline hover:text-blue-800"
              >
                {API_BASE_URL}/health
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          💡 Use <strong className="text-slate-700">"تجربة النظام"</strong> to preview the app without a backend.
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
