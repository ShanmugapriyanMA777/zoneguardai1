@echo off
setlocal
title Deploy ZoneGuard AI to Vercel

echo =========================================================================
echo  🚀  ZONEGUARD AI — VERCEL CLOUD DEPLOYMENT
echo =========================================================================
echo  [*] Preparing production build and launching Vercel CLI...
echo.

cd /d "%~dp0"

echo [*] Step 1: Building production web assets...
call npm.cmd --prefix frontend run build

echo.
echo [*] Step 2: Deploying to Vercel Cloud...
echo -------------------------------------------------------------------------
echo Follow the prompts on screen to authenticate and link your Vercel project:
echo   - Set up and deploy: [Y]
echo   - Which scope: [Your Account / Team]
echo   - Link to existing project: [N]
echo   - Project name: [zoneguard-ai]
echo -------------------------------------------------------------------------
echo.

call npx.cmd vercel --prod

echo.
echo =========================================================================
echo  [DONE] Vercel Deployment Process Completed!
echo =========================================================================
pause
