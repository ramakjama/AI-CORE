@echo off
REM ============================================================================
REM Test Log Generator for Windows
REM ============================================================================

echo =========================================
echo 🧪 ELK Stack Log Generator
echo =========================================
echo.

set /p COUNT="Enter number of logs to generate (default 1000): "
if "%COUNT%"=="" set COUNT=1000

set /p DELAY="Enter delay between logs in ms (default 100): "
if "%DELAY%"=="" set DELAY=100

echo.
echo Generating %COUNT% logs with %DELAY%ms delay...
echo.

cd /d "%~dp0"
python generate-test-logs.py %COUNT% %DELAY%

echo.
pause
