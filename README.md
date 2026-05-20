# SEC60 ⚡ — AI-Powered Solar Feasibility Platform

> Analyze whether solar energy is financially viable for any Saudi location — in under 60 seconds.

---

## ⚡ Fastest Start (Windows — one click)

```
Double-click  start_all.bat
```

This opens two terminal windows (backend + frontend) and launches the browser automatically at **http://localhost:5173**.

---

## 🚀 Manual Start (step by step)

Open **two separate terminal windows** and run:

### Terminal 1 — Backend (FastAPI)

```bash
cd C:\Users\shouq\sec60\backend

# Activate the virtual environment (Windows)
venv\Scripts\activate

# Start the API server
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: SEC60 API  —  http://localhost:8000
INFO: Swagger UI —  http://localhost:8000/docs
INFO: Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Frontend (Vite + React)

```bash
cd C:\Users\shouq\sec60\frontend

npm run dev
```

You should see:
```
  VITE  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

### Open the app

👉 **http://localhost:5173**

---

## 🔧 First-time Setup

If you haven't installed dependencies yet:

### Backend
```bash
cd sec60\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Train the ML models (takes ~30 seconds — only needed once)
python models\train_model.py
```

### Frontend
```bash
cd sec60\frontend
npm install

# Create the .env file (sets the backend URL)
copy .env.example .env
```

---

## 🌐 Environment Variables

### `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:8000
```

- Change this if your backend runs on a different port.
- Must restart `npm run dev` after editing.

### `backend/.env` (optional)
```
# OPENAI_API_KEY=sk-...       # Enables LLM-powered AI explanations
# GROQ_API_KEY=gsk_...        # Alternative LLM provider
# TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## 🔴 Troubleshooting — Connection Refused

### Problem: "لا يمكن الاتصال بخادم API" / "Cannot reach API server"

The frontend cannot talk to the backend. Work through this checklist:

---

#### ✅ Check 1 — Is the backend running?

Open: **http://localhost:8000/health**

Expected response:
```json
{ "status": "ok", "service": "SEC60 API" }
```

If the page doesn't load → the backend is **not running**. Start it:

```bash
cd sec60\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

---

#### ✅ Check 2 — Wrong port?

If you started the backend on a port other than 8000, update `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:YOUR_PORT
```

Then restart the frontend:
```bash
# Stop npm run dev (Ctrl+C), then:
npm run dev
```

---

#### ✅ Check 3 — CORS error in browser console?

Open DevTools → Console. If you see:

```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

Make sure the backend `main.py` has the correct allowed origins (it already does by default):

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    ...
]
```

Restart the backend after any change to `main.py`.

---

#### ✅ Check 4 — Frontend calling wrong URL?

Open browser DevTools → Network tab → look at any failed request.

The request URL should be `http://localhost:8000/analyze` (or `/cities`, `/health`).

If it shows a different URL, check `frontend/.env` and make sure `VITE_API_BASE_URL` is set correctly.

---

#### ✅ Check 5 — Virtual environment not activated?

If you see `ModuleNotFoundError` when starting uvicorn, the venv is not active:

```bash
# Windows
cd sec60\backend
venv\Scripts\activate        ← must show (venv) prefix in terminal
uvicorn main:app --reload --port 8000
```

---

#### ✅ Check 6 — ML models missing?

If the backend starts but `/analyze` returns errors about missing models:

```bash
cd sec60\backend
venv\Scripts\activate
python models\train_model.py
```

---

## 🎯 Demo Mode (no backend required)

On the home page, click **"تجربة النظام بمثال سريع"** to load pre-computed demo results without needing the backend. Useful for live presentations.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend liveness check |
| GET | `/cities` | List of 12 supported Saudi cities |
| POST | `/analyze` | Full solar feasibility analysis |
| POST | `/ocr-bill` | Extract consumption from bill image/PDF |
| POST | `/generate-report` | Generate PDF report |
| GET | `/reports/{filename}` | Download generated PDF |
| GET | `/docs` | Swagger interactive API docs |

---

## 🤖 AI Model Details

- **Algorithm**: RandomForestRegressor (system size) + GradientBoostingRegressor (feasibility score)
- **Training data**: 6,000 synthetic Saudi solar scenarios
- **Features**: city irradiance, tariff, monthly kWh, area, facility type, system type
- **Fallback**: physics-based formula if `.pkl` files are missing
- **Model files**: `backend/models/system_size_model.pkl` and `feasibility_model.pkl`

---

## 📁 Project Structure

```
sec60/
├── start_all.bat           ← One-click launcher (Windows)
├── start_backend.bat
├── start_frontend.bat
├── backend/
│   ├── main.py             ← FastAPI app (CORS, routers, /health)
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/               ← Saudi cities + assumptions JSON
│   ├── models/             ← Trained .pkl files + train_model.py
│   ├── routes/             ← analyze, cities, ocr, report
│   ├── services/           ← solar, ml, financial, ai, ocr, report
│   └── reports/            ← Generated PDFs (auto-created)
└── frontend/
    ├── .env                ← VITE_API_BASE_URL=http://localhost:8000
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── services/api.ts     ← Axios client + demo data
        ├── components/
        │   └── ApiStatusBanner.tsx  ← Shows when backend is offline
        └── pages/
            ├── Home.tsx
            └── Results.tsx
```

---

## 🔌 Ports Summary

| Service | URL | Note |
|---------|-----|------|
| Frontend | http://localhost:5173 | `npm run dev` |
| Backend  | http://localhost:8000 | `uvicorn main:app --port 8000` |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Health   | http://localhost:8000/health | Liveness check |
