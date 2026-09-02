$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = "C:\Users\Shanmugapriyan\.gemini\antigravity-ide\scratch\zoneguard-ai" }

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " 🐙  ZONEGUARD AI — PUSH TO GITHUB REPOSITORY" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " Target: https://github.com/ShanmugapriyanMA777/zoneguardai1.git" -ForegroundColor White
Write-Host " Branch: main`n" -ForegroundColor White

Set-Location $RootDir

Write-Host "[*] Staging all files..." -ForegroundColor Yellow
git add .

Write-Host "[*] Latest Commit:" -ForegroundColor Yellow
git log -1 --oneline

Write-Host "`n[*] Pushing to GitHub (origin/main)..." -ForegroundColor Yellow
git push origin main
