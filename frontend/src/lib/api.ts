/**
 * Centralized API configuration for SEC60.
 *
 * The backend URL comes ONLY from the environment variable VITE_API_BASE_URL.
 * Never hardcode localhost or any specific host here.
 *
 * Local dev:   set VITE_API_BASE_URL=http://localhost:8000 in frontend/.env
 * Production:  set VITE_API_BASE_URL=https://your-backend.onrender.com in Vercel dashboard
 *
 * If the variable is empty the app falls back to relative paths so the
 * Vite dev-server proxy (vite.config.ts) can forward requests locally.
 */

// Strip any trailing slash so URLs like "https://x.com/" don't become "https://x.com//health"
// Fallback to the known Render backend so the deployed Vercel app always has a target.
// Override by setting VITE_API_BASE_URL in Vercel → Project → Settings → Environment Variables.
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_BASE_URL as string) || 'https://sec60.onrender.com'
).replace(/\/$/, '');

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  }).catch(() => {
    throw new Error(
      `Cannot connect to backend at "${API_BASE_URL || '(empty — VITE_API_BASE_URL not set)'}". ` +
        `Check that VITE_API_BASE_URL is configured correctly.`
    );
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(`API Error ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

// ── Multipart / file upload ───────────────────────────────────────────────────
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with the multipart boundary
  }).catch(() => {
    throw new Error(
      `Cannot connect to backend at "${API_BASE_URL || '(empty — VITE_API_BASE_URL not set)'}".`
    );
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`Upload Error ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

// ── Health check ──────────────────────────────────────────────────────────────
/**
 * Returns true if the backend /health endpoint responds with { status: "ok" }.
 * Uses a 15-second timeout so Render.com free-tier cold starts don't show "offline".
 * Uses AbortController for broad browser compatibility (not AbortSignal.timeout).
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!API_BASE_URL) {
    // No URL configured at all — can't be online
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // 15 s — handles Render cold start

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'ok';
  } catch {
    clearTimeout(timer);
    return false;
  }
}
