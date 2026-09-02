@echo off
setlocal
title ZoneGuard AI — National Disaster Command Suite

echo =========================================================================
echo  🛡️  ZONEGUARD AI — NATIONAL DISASTER COMMAND & RELOCATION SUITE
echo =========================================================================
echo  [*] Launching ZoneGuard AI Microservices Architecture...
echo.

set "ROOT_DIR=%~dp0"
set "PYTHON_EXE=C:\Users\Shanmugapriyan\AppData\Local\Programs\Python\Python312\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

echo [*] Service 1/3: Starting FastAPI Backend on http://127.0.0.1:8000...
start "ZoneGuard - Backend Server (Port 8000)" cmd /k "cd /d "%ROOT_DIR%backend" && "%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [*] Service 2/3: Starting Main Command Dashboard on http://localhost:5173...
start "ZoneGuard - State Command Center (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm.cmd run dev"

timeout /t 2 >nul

echo [*] Service 3/3: Starting Field Officer Ground-Truth Portal on http://localhost:5174...
start "ZoneGuard - Field Officer Portal (Port 5174)" cmd /k "cd /d "%ROOT_DIR%field-portal" && npm.cmd run dev"

timeout /t 3 >nul

echo.
echo =========================================================================
echo  [SUCCESS] All ZoneGuard AI Services are Active!
echo.
echo  • Main Command Dashboard:      http://localhost:5173
echo  • Field Officer Ground Portal: http://localhost:5174
echo  • Backend REST API & Docs:     http://127.0.0.1:8000/docs
echo  • Field Officer Android APK:   ZoneGuard-FieldOps.apk
echo =========================================================================
echo.
echo Launching Web Dashboards in your default browser...
start http://localhost:5173
start http://localhost:5174

pause
