@echo off
echo ===================================================
echo   Starting Operational Memory & Copilot Application
echo ===================================================
echo.

echo [1/2] Starting FastAPI backend on port 8000...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait a moment for the backend to initialize
timeout /t 3 /nobreak >nul

echo [2/2] Starting Next.js frontend on port 3000...
start "Frontend - Next.js" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo   Both servers are starting successfully!
echo.
echo   App Dashboard:       http://localhost:3000
echo   Company Copilot:     http://localhost:3000/copilot
echo   Operational Memory:  http://localhost:3000/memory
echo   Knowledge Graph:     http://localhost:3000/knowledge
echo   Data Ingestion:      http://localhost:3000/ingest
echo.
echo   Backend API:         http://localhost:8000
echo   Swagger Docs:        http://localhost:8000/docs
echo ===================================================
echo.
echo You can close this window. The servers run in separate windows.
pause
