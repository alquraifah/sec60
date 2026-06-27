import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file for the current mode so the proxy target can read VITE_API_BASE_URL
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Proxy API calls to the backend in dev mode.
      // In production (Vercel) this proxy is NOT used —
      // the browser calls VITE_API_BASE_URL directly.
      proxy: {
        '/analyze':         { target: backendUrl, changeOrigin: true },
        '/cities':          { target: backendUrl, changeOrigin: true },
        '/ocr-bill':        { target: backendUrl, changeOrigin: true },
        '/generate-report': { target: backendUrl, changeOrigin: true },
        '/reports':         { target: backendUrl, changeOrigin: true },
        '/health':          { target: backendUrl, changeOrigin: true },
        '/forecast':        { target: backendUrl, changeOrigin: true },
      },
    },
  }
})
