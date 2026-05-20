@echo off
title SEC60 — Launch All Servers
echo.
echo  ==========================================
echo   SEC60 — Starting Backend + Frontend
echo  ==========================================
echo.
echo  Backend  -> http://localhost:8000
echo  Frontend -> http://localhost:5173
echo.

:: Start backend in a new window
start "SEC60 Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend in a new window
start "SEC60 Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait 4 more seconds then open browser
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo  Both servers started. Browser opening...
echo  Close the terminal windows to stop the servers.
pause
