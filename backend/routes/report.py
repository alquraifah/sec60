"""
POST /generate-report  — generate bilingual PDF report (AR or EN).
GET  /download-report/{filename} — download PDF with Safari-compatible headers.
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any

from services.report_service import generate

router = APIRouter()

REPORTS_DIR = Path(__file__).parent.parent / "reports"


class ReportRequest(BaseModel):
    analysis: dict[str, Any]
    language: str = "ar"


@router.post("/generate-report")
def generate_report(req: ReportRequest):
    lang = req.language if req.language in ("ar", "en") else "ar"
    try:
        filename = generate(req.analysis, language=lang)
        return {
            "success": True,
            "report_url": f"/download-report/{filename}",
            "filename": filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")


@router.get("/download-report/{filename}")
def download_report(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    filepath = REPORTS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=str(filepath),
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
