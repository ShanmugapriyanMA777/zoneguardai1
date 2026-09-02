$RootDir = $PSScriptRoot
if (-not $RootDir) { $RootDir = "C:\Users\Shanmugapriyan\.gemini\antigravity-ide\scratch\zoneguard-ai" }

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " 🚀  ZONEGUARD AI — VERCEL CLOUD DEPLOYMENT" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan

Set-Location $RootDir

Write-Host "`n[*] Step 1: Building production web assets..." -ForegroundColor Yellow
npm.cmd --prefix frontend run build

Write-Host "`n[*] Step 2: Launching Vercel Deployment CLI..." -ForegroundColor Yellow
Write-Host "Follow the interactive prompts to deploy to your Vercel account.`n" -ForegroundColor White

npx.cmd vercel --prod
