"""
SEC60 — AI-Powered Solar Feasibility Platform
FastAPI backend entry point.

Start:
    cd backend
    venv\Scripts\activate          # Windows
    source venv/bin/activate       # Mac / Linux
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.analyze import router as analyze_router
from routes.cities import router as cities_router
from routes.ocr import router as ocr_router
from routes.report import router as report_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SEC60 API",
    description="SEC60 — AI-Powered Solar Feasibility Platform | منصة سيك60 للجدوى الشمسية بالذكاء الاصطناعي",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(analyze_router)          # POST /analyze
app.include_router(cities_router)           # GET  /cities
app.include_router(ocr_router)              # POST /ocr-bill
app.include_router(report_router)           # POST /generate-report

# ── Serve generated PDF reports ───────────────────────────────────────────────
REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)
app.mount("/reports", StaticFiles(directory=str(REPORTS_DIR)), name="reports")

# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    models_dir = Path("models")
    ml_ready = (
        (models_dir / "system_size_model.pkl").exists()
        and (models_dir / "feasibility_model.pkl").exists()
    )
    return {
        "status": "ok",
        "message": "SEC60 backend is running",
        "ml_models_ready": ml_ready,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.on_event("startup")
async def on_startup():
    logger.info("=" * 55)
    logger.info("  SEC60 API       http://localhost:8000")
    logger.info("  Swagger docs    http://localhost:8000/docs")
    logger.info("  Frontend        http://localhost:5173")
    logger.info("=" * 55)
