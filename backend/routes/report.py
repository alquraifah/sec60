"""
POST /generate-report  — generate bilingual PDF report (AR or EN).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

from services.report_service import generate

router = APIRouter()


class ReportRequest(BaseModel):
    analysis: dict[str, Any]
    language: str = "ar"   # "ar" (Arabic RTL) | "en" (English LTR)


@router.post("/generate-report")
def generate_report(req: ReportRequest):
    lang = req.language if req.language in ("ar", "en") else "ar"
    try:
        filename = generate(req.analysis, language=lang)
        return {"success": True, "report_url": f"/reports/{filename}", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")
