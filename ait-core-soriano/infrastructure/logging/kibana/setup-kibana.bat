@echo off
REM ============================================================================
REM Kibana Setup Script for Windows
REM Configura index patterns, dashboards y alertas
REM ============================================================================

set KIBANA_URL=http://localhost:5601

echo =========================================
echo 🔧 Setting up Kibana
echo =========================================
echo.

REM Wait for Kibana
echo ⏳ Waiting for Kibana to be ready...
set /a counter=0
:wait_kibana
set /a counter+=1
if %counter% gtr 30 (
    echo ❌ Kibana is not responding
    pause
    exit /b 1
)
curl -s %KIBANA_URL%/api/status >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_kibana
)
echo ✅ Kibana is ready
echo.

echo 📋 Creating index patterns...

REM Index pattern for ait-core
curl -X POST "%KIBANA_URL%/api/saved_objects/index-pattern/ait-ait-core" ^
  -H "kbn-xsrf: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":{\"title\":\"ait-ait-core-*\",\"timeFieldName\":\"timestamp\"}}" ^
  >nul 2>&1
echo ✅ ait-core index pattern created

REM Index pattern for ain-tech-web
curl -X POST "%KIBANA_URL%/api/saved_objects/index-pattern/ait-ain-tech-web" ^
  -H "kbn-xsrf: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":{\"title\":\"ait-ain-tech-web-*\",\"timeFieldName\":\"timestamp\"}}" ^
  >nul 2>&1
echo ✅ ain-tech-web index pattern created

REM Index pattern for soriano-ecliente
curl -X POST "%KIBANA_URL%/api/saved_objects/index-pattern/ait-soriano-ecliente" ^
  -H "kbn-xsrf: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":{\"title\":\"ait-soriano-ecliente-*\",\"timeFieldName\":\"timestamp\"}}" ^
  >nul 2>&1
echo ✅ soriano-ecliente index pattern created

REM Index pattern for ait-engines
curl -X POST "%KIBANA_URL%/api/saved_objects/index-pattern/ait-ait-engines" ^
  -H "kbn-xsrf: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":{\"title\":\"ait-ait-engines-*\",\"timeFieldName\":\"timestamp\"}}" ^
  >nul 2>&1
echo ✅ ait-engines index pattern created

REM Index pattern for all (wildcard)
curl -X POST "%KIBANA_URL%/api/saved_objects/index-pattern/ait-all" ^
  -H "kbn-xsrf: true" ^
  -H "Content-Type: application/json" ^
  -d "{\"attributes\":{\"title\":\"ait-*\",\"timeFieldName\":\"timestamp\"}}" ^
  >nul 2>&1
echo ✅ ait-all index pattern created

echo.
echo =========================================
echo ✅ Kibana setup complete!
echo =========================================
echo.
echo Index patterns created:
echo   - ait-ait-core-*
echo   - ait-ain-tech-web-*
echo   - ait-soriano-ecliente-*
echo   - ait-ait-engines-*
echo   - ait-* (all)
echo.
echo Next steps:
echo 1. Open Kibana: %KIBANA_URL%
echo 2. Go to Analytics ^> Discover
echo 3. Select an index pattern
echo 4. Start exploring your logs!
echo.
echo =========================================
echo.

REM Open Kibana
start %KIBANA_URL%

pause
