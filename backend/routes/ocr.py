"""
POST /ocr-bill  — extract consumption/amount from electricity bill image or PDF.
"""

from fastapi import APIRouter, File, UploadFile, HTTPException
from services.ocr_service import process_bill

router = APIRouter()


@router.post("/ocr-bill")
async def ocr_bill(file: UploadFile = File(...)):
    """
    Upload an electricity bill image (PNG/JPG) or PDF.
    Returns extracted kWh consumption and/or SAR amount.
    Requires Tesseract-OCR installed (see README).
    """
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size must be under 10 MB")

    content = await file.read()
    result = await process_bill(content, file.filename or "upload")
    return result
