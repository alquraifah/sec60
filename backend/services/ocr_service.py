"""
OCR service for electricity bill extraction.
Requires: Tesseract-OCR installed + pytesseract + Pillow.
PyMuPDF (fitz) is used for PDF text extraction if available.
Both are graceful-degraded — the endpoint returns an error message if unavailable.
"""

import io
import re
import os

try:
    import pytesseract
    from PIL import Image

    # Allow override via environment variable
    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    TESSERACT_OK = True
except ImportError:
    TESSERACT_OK = False

try:
    import fitz  # PyMuPDF

    PYMUPDF_OK = True
except ImportError:
    PYMUPDF_OK = False


# ── Bill amount / consumption patterns ───────────────────────────────────────
KWH_PATTERNS = [
    r"(\d[\d,]+(?:\.\d+)?)\s*(?:kWh|kwh|كيلوواط\.?ساعة|ك\.و\.س)",
    r"(?:الاستهلاك|استهلاك)[^\d]*(\d[\d,]+(?:\.\d+)?)",
    r"(?:consumption)[^\d]*(\d[\d,]+(?:\.\d+)?)",
    r"(?:units|وحدة)[^\d]*(\d[\d,]+(?:\.\d+)?)",
]

SAR_PATTERNS = [
    r"(?:المبلغ\s*الإجمالي|إجمالي\s*الفاتورة|المستحق|total)[^\d]*(\d[\d,]+(?:\.\d+)?)",
    r"(\d[\d,]+(?:\.\d+)?)\s*(?:SAR|ريال|ر\.س\.?)",
    r"(?:amount\s*due|net\s*amount)[^\d]*(\d[\d,]+(?:\.\d+)?)",
]


def _extract_values(text: str) -> dict:
    """Parse Arabic/English electricity bill text for kWh and SAR values."""
    kwh_val = None
    sar_val = None
    confidence = 0.0

    for pat in KWH_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            kwh_val = float(m.group(1).replace(",", ""))
            if 10 < kwh_val < 1_000_000:
                confidence = max(confidence, 0.85)
                break

    for pat in SAR_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = float(m.group(1).replace(",", ""))
            if 5 < val < 500_000:
                sar_val = val
                confidence = max(confidence, 0.75)
                break

    return {
        "extracted_kwh": kwh_val,
        "extracted_sar": sar_val,
        "confidence": round(confidence, 2),
        "raw_text_preview": text[:600].strip(),
    }


async def process_bill(file_bytes: bytes, filename: str) -> dict:
    """
    Extract electricity consumption or bill amount from an uploaded image or PDF.
    Returns a dict with extracted values, confidence, and raw text preview.
    """
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    text = ""
    method = "none"

    # ── PDF ──────────────────────────────────────────────────────
    if ext == "pdf":
        if not PYMUPDF_OK:
            return {
                "success": False,
                "error": "معالجة PDF تتطلب تثبيت PyMuPDF: pip install PyMuPDF",
                "extracted_kwh": None,
                "extracted_sar": None,
                "confidence": 0,
                "raw_text_preview": "",
            }
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        method = "pymupdf"

    # ── Image ─────────────────────────────────────────────────────
    elif ext in ("png", "jpg", "jpeg", "webp", "tiff", "bmp"):
        if not TESSERACT_OK:
            return {
                "success": False,
                "error": "OCR يتطلب تثبيت Tesseract و pytesseract. راجع README للتفاصيل.",
                "extracted_kwh": None,
                "extracted_sar": None,
                "confidence": 0,
                "raw_text_preview": "",
            }
        try:
            img = Image.open(io.BytesIO(file_bytes))
            # Try Arabic + English; fall back to English only
            try:
                text = pytesseract.image_to_string(img, lang="ara+eng")
            except Exception:
                text = pytesseract.image_to_string(img, lang="eng")
            method = "tesseract"
        except Exception as e:
            return {
                "success": False,
                "error": f"فشل في معالجة الصورة: {str(e)}",
                "extracted_kwh": None,
                "extracted_sar": None,
                "confidence": 0,
                "raw_text_preview": "",
            }
    else:
        return {
            "success": False,
            "error": f"نوع الملف غير مدعوم: .{ext}. استخدم PDF أو صورة (PNG/JPG)",
            "extracted_kwh": None,
            "extracted_sar": None,
            "confidence": 0,
            "raw_text_preview": "",
        }

    result = _extract_values(text)
    result["success"] = bool(result["extracted_kwh"] or result["extracted_sar"])
    result["method"] = method
    if not result["success"]:
        result["error"] = "لم يتم التعرف على قيم الاستهلاك أو المبلغ من الملف. أدخل القيم يدوياً."
    return result
