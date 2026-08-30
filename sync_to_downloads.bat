@echo off
setlocal
set "SRC=C:\Users\Shanmugapriyan\.gemini\antigravity-ide\scratch\zoneguard-ai"
set "DST=C:\Users\Shanmugapriyan\Downloads\ZoneGuard-AI-Dashboard\ZoneGuard-AI-Dashboard"

echo ========================================================
echo  Syncing ZoneGuard AI Project to Downloads Folder
echo  Source: %SRC%
echo  Target: %DST%
echo ========================================================

robocopy "%SRC%" "%DST%" /E /XD node_modules .venv __pycache__ .git /NFL /NDL /NJH /NJS /nc /ns /np

echo.
echo [SUCCESS] Complete ZoneGuard AI framework copied to:
echo   %DST%
echo.
pause
