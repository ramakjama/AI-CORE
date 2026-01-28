@echo off
REM ============================================================================
REM ELK Stack Stop Script for Windows
REM ============================================================================

echo =========================================
echo 🛑 Stopping ELK Stack
echo =========================================
echo.

cd /d "%~dp0"

docker-compose -f docker-compose.elk.yml down

echo.
echo ✅ ELK Stack stopped successfully
echo.
pause
