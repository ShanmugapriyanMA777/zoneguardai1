@echo off
setlocal
title Push ZoneGuard AI to GitHub

echo =========================================================================
echo  🐙  ZONEGUARD AI — PUSH TO GITHUB REPOSITORY
echo =========================================================================
echo  Target: https://github.com/ShanmugapriyanMA777/zoneguardai1.git
echo  Branch: main
echo.

cd /d "%~dp0"

echo [*] Staging all changes...
git add -A

git diff-index --quiet HEAD --
if %ERRORLEVEL% NEQ 0 (
    echo [*] Committing updated deployment configuration...
    git commit -m "fix: production deployment readiness, vercel config, and native cloud support"
) else (
    echo [*] Working directory clean, no new commit needed.
)

echo [*] Current Commit Status:
git log -1 --oneline
echo.

echo [*] Pushing to GitHub (origin/main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo  [SUCCESS] Successfully pushed all commits to GitHub!
    echo  View Repo: https://github.com/ShanmugapriyanMA777/zoneguardai1
    echo =========================================================================
) else (
    echo.
    echo [ERROR] Push failed. If prompted, please authorize Git with your GitHub account.
)

pause
