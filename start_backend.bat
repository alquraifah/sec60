@echo off
title SEC60 Backend (FastAPI)
color 0A

echo.
echo  ==========================================
echo   SEC60 Backend Starting on port 8000
echo  ==========================================
echo.

cd /d "%~dp0backend"

:: Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [ERROR] Virtual environment not found.
    echo Run this first:
    echo   cd backend
    echo   python -m venv venv
    echo   venv\Scripts\pip install -r requirements.txt
    echo   python models\train_model.py
    pause
    exit /b 1
)

:: Check that uvicorn is installed
where uvicorn >nul 2>&1
if errorlevel 1 (
    echo [ERROR] uvicorn not found. Installing dependencies...
    pip install -r requirements.txt
)

echo [OK] Virtual environment activated
echo [OK] Starting FastAPI on http://localhost:8000
echo [OK] Swagger docs at http://localhost:8000/docs
echo.

uvicorn main:app --reload --port 8000 --host 0.0.0.0

pause
