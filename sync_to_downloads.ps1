$SourceDir = "C:\Users\Shanmugapriyan\.gemini\antigravity-ide\scratch\zoneguard-ai"
$TargetDir = "C:\Users\Shanmugapriyan\Downloads\ZoneGuard-AI-Dashboard\ZoneGuard-AI-Dashboard"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Syncing ZoneGuard AI Project to Downloads Directory" -ForegroundColor Green
Write-Host " Source: $SourceDir" -ForegroundColor White
Write-Host " Target: $TargetDir" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
}

robocopy "$SourceDir" "$TargetDir" /E /XD node_modules .venv __pycache__ .git /NFL /NDL /NJH /NJS /nc /ns /np

Write-Host "`n[SUCCESS] Project files copied successfully to:" -ForegroundColor Green
Write-Host "  $TargetDir" -ForegroundColor Yellow
