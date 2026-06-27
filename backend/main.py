"""
SEC60 — AI-Powered Solar Feasibility Platform
FastAPI backend entry point.

Start locally:
    cd backend
    venv\\Scripts\\activate          # Windows
    source venv/bin/activate         # Mac / Linux
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Render deployment uses render.yaml (repo root).
"""

import os
import sys
import logging
import threading
import subprocess
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.analyze import router as analyze_router
from routes.cities import router as cities_router
from routes.ocr import router as ocr_router
from routes.report import router as report_router
from routes.forecast import router as forecast_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SEC60 API",
    description="SEC60 — AI-Powered Solar Feasibility Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Extra origins can be added via ALLOWED_ORIGINS env var (comma-separated).
_extra_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

CORS_ORIGINS = [
    "https://sec60.vercel.app",
    "https://sec60-git-main-alquraifah.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
] + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(analyze_router)           # POST /analyze
app.include_router(cities_router)            # GET  /cities
app.include_router(ocr_router)               # POST /ocr-bill
app.include_router(report_router)            # POST /generate-report
app.include_router(forecast_router)          # POST /forecast

# ── Static: PDF reports ───────────────────────────────────────────────────────
REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")


# ── ML model auto-training ────────────────────────────────────────────────────
def _models_present() -> bool:
    m = Path("models")
    return (
        (m / "system_size_model.pkl").exists()
        and (m / "feasibility_model.pkl").exists()
    )


def _train_models() -> None:
    """Train missing ML models. Runs in a daemon thread at startup."""
    if _models_present():
        logger.info("ML models already present — skipping training.")
        return

    logger.info("ML models missing — training now (takes ~20 s)...")
    Path("models").mkdir(exist_ok=True)

    for script in ("models/train_model.py", "ml/train_model.py"):
        if not Path(script).exists():
            continue
        try:
            subprocess.run(
                [sys.executable, script],
                check=True,
                timeout=300,
                capture_output=False,
            )
            logger.info("Trained: %s", script)
        except Exception as exc:
            logger.warning("Training failed for %s: %s — formula fallback will be used.", script, exc)


# ── Health endpoint ───────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "SEC60 backend is running",
        "ml_models_ready": _models_present(),
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("SEC60 API starting...")

    # Train ML models in a background thread if they are missing.
    # On Render this is a fallback — render.yaml build command trains them first.
    # On cold local starts they are trained here so the first request doesn't block.
    if not _models_present():
        t = threading.Thread(target=_train_models, daemon=True, name="model-trainer")
        t.start()
        logger.info("Model training thread started in background.")
    else:
        logger.info("ML models ready.")

    logger.info("SEC60 API ready — /health /docs /analyze /cities")
