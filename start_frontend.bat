@echo off
title SEC60 Frontend (Vite + React)
color 0B

echo.
echo  ==========================================
echo   SEC60 Frontend Starting on port 5173
echo  ==========================================
echo.

cd /d "%~dp0frontend"

:: Check node_modules
if not exist "node_modules" (
    echo [INFO] node_modules not found. Running npm install...
    npm install
)

:: Ensure .env exists
if not exist ".env" (
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env
)

echo [OK] Starting Vite dev server...
echo [OK] Open http://localhost:5173 in your browser
echo.

npm run dev

pause
