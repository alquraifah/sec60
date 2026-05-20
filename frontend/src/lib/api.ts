/**
 * Centralized API configuration for SEC60.
 *
 * All backend calls go through apiRequest() so that:
 *  - The base URL is set in one place (frontend/.env → VITE_API_BASE_URL)
 *  - Error messages are consistent
 *  - Changing the backend URL only requires editing .env
 *
 * Usage:
 *   import { apiRequest, checkBackendHealth } from '../lib/api';
 *
 *   const data = await apiRequest('/cities');
 *   const ok   = await checkBackendHealth();
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Core fetch wrapper ─────────────────────────────────────────────────────────
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
    // fetch() itself throws on network errors (backend unreachable)
    throw new Error(
      `Cannot connect to backend at ${API_BASE_URL}. ` +
      `Make sure FastAPI is running:\n` +
      `  cd backend && venv\\Scripts\\activate && uvicorn main:app --reload --port 8000`
    );
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail ?? detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(`API Error ${response.status}: ${detail}`);
  }

  return response.json() as Promise<T>;
}

// ── Multipart / file upload wrapper ───────────────────────────────────────────
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser sets it with the correct boundary
  }).catch(() => {
    throw new Error(`Cannot connect to backend at ${API_BASE_URL}.`);
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
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
