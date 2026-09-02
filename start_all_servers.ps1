$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = "C:\Users\Shanmugapriyan\.gemini\antigravity-ide\scratch\zoneguard-ai" }

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " 🛡️  ZONEGUARD AI — NATIONAL DISASTER COMMAND & RELOCATION SUITE" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " [*] Launching ZoneGuard AI Microservices Architecture..." -ForegroundColor White

$PythonExe = "C:\Users\Shanmugapriyan\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $PythonExe)) { $PythonExe = "python" }

# Service 1: Backend
Write-Host " [*] Service 1/3: Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$RootDir\backend`" && `"$PythonExe`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# Service 2: Main Frontend
Write-Host " [*] Service 2/3: Starting Main Command Dashboard on http://localhost:5173..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$RootDir\frontend`" && npm.cmd run dev"

Start-Sleep -Seconds 2

# Service 3: Field Portal
Write-Host " [*] Service 3/3: Starting Field Officer Portal on http://localhost:5174..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/k cd /d `"$RootDir\field-portal`" && npm.cmd run dev"

Start-Sleep -Seconds 3

Write-Host "`n=========================================================================" -ForegroundColor Cyan
Write-Host " [SUCCESS] All ZoneGuard AI Services are Active!" -ForegroundColor Green
Write-Host " • Main Command Dashboard:      http://localhost:5173" -ForegroundColor White
Write-Host " • Field Officer Ground Portal: http://localhost:5174" -ForegroundColor White
Write-Host " • Backend REST API & Docs:     http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host " • Field Officer Android APK:   ZoneGuard-FieldOps.apk" -ForegroundColor White
Write-Host "=========================================================================`n" -ForegroundColor Cyan

Start-Process "http://localhost:5173"
Start-Process "http://localhost:5174"
