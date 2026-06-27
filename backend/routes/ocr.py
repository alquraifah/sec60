"""
POST /ocr-bill — extract bill amount / kWh from electricity bill image or PDF.

Never raises HTTP 4xx/5xx for OCR failures — always returns JSON so the
frontend can handle the result gracefully and let the user continue manually.
"""

import logging
from fastapi import APIRouter, File, UploadFile
from services.ocr_service import process_bill

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/ocr-bill")
async def ocr_bill(file: UploadFile = File(...)):
    """
    Upload a bill image (PNG/JPG/JPEG) or PDF.

    Response always has shape:
      {
        "success":        bool,
        "extracted_bill": float | null,   # SAR amount
        "extracted_kwh":  float | null,   # kWh consumption
        "confidence":     "high" | "medium" | "low",
        "message":        str
      }

    On any error the response is success=false with a user-friendly message.
    The frontend should never block the analysis because OCR failed.
    """
    try:
        content = await file.read()
    except Exception as e:
        logger.error("Failed to read uploaded file: %s", e)
        return {
            "success": False,
            "extracted_bill": None,
            "extracted_kwh": None,
            "confidence": "low",
            "message": "فشل قراءة الملف. يرجى المحاولة مرة أخرى أو إدخال القيمة يدويًا.",
        }

    if len(content) > MAX_FILE_SIZE:
        return {
            "success": False,
            "extracted_bill": None,
            "extracted_kwh": None,
            "confidence": "low",
            "message": "حجم الملف يتجاوز 10 ميجابايت. يرجى رفع ملف أصغر.",
        }

    filename = file.filename or "upload.jpg"
    logger.info("OCR request: %s (%d bytes)", filename, len(content))

    # process_bill never raises — always returns valid dict
    result = await process_bill(content, filename)

    logger.info(
        "OCR result: success=%s bill=%s kwh=%s confidence=%s",
        result.get("success"),
        result.get("extracted_bill"),
        result.get("extracted_kwh"),
        result.get("confidence"),
    )
    return result
