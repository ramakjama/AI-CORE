@echo off
REM ============================================================================
REM ELK Stack Validation Script for Windows
REM Valida que todo el sistema de logging funcione correctamente
REM ============================================================================

echo =========================================
echo 🔍 ELK Stack Validation
echo =========================================
echo.

cd /d "%~dp0"

set PASSED=0
set FAILED=0

REM Test 1: Docker containers running
echo [TEST 1/10] Checking Docker containers...
docker ps | findstr "ait-elasticsearch" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Elasticsearch container not running
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Elasticsearch container running
    set /a PASSED+=1
)

docker ps | findstr "ait-logstash" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Logstash container not running
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Logstash container running
    set /a PASSED+=1
)

docker ps | findstr "ait-kibana" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Kibana container not running
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Kibana container running
    set /a PASSED+=1
)

echo.

REM Test 2: Elasticsearch health
echo [TEST 2/10] Checking Elasticsearch health...
curl -s http://localhost:9200/_cluster/health | findstr "green\|yellow" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Elasticsearch cluster not healthy
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Elasticsearch cluster healthy
    set /a PASSED+=1
)
echo.

REM Test 3: Logstash API accessible
echo [TEST 3/10] Checking Logstash API...
curl -s http://localhost:9600 >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Logstash API not accessible
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Logstash API accessible
    set /a PASSED+=1
)
echo.

REM Test 4: Kibana API accessible
echo [TEST 4/10] Checking Kibana API...
curl -s http://localhost:5601/api/status >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Kibana API not accessible
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Kibana API accessible
    set /a PASSED+=1
)
echo.

REM Test 5: Logstash TCP port
echo [TEST 5/10] Checking Logstash TCP port (5000)...
netstat -an | findstr ":5000" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Logstash TCP port 5000 not listening
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Logstash TCP port 5000 listening
    set /a PASSED+=1
)
echo.

REM Test 6: Logstash HTTP port
echo [TEST 6/10] Checking Logstash HTTP port (8080)...
netstat -an | findstr ":8080" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Logstash HTTP port 8080 not listening
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Logstash HTTP port 8080 listening
    set /a PASSED+=1
)
echo.

REM Test 7: Send test log
echo [TEST 7/10] Sending test log to Logstash...
curl -X POST http://localhost:5000 -H "Content-Type: application/json" -d "{\"message\":\"Test validation log\",\"application\":\"validation\",\"level\":\"info\",\"timestamp\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z\"}" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Could not send test log
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Test log sent successfully
    set /a PASSED+=1
)
echo.

REM Test 8: Wait and check if log appears in Elasticsearch
echo [TEST 8/10] Checking if test log appears in Elasticsearch (waiting 5s)...
timeout /t 5 /nobreak >nul
curl -s "http://localhost:9200/ait-*/_search?q=validation" | findstr "validation" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Test log not found in Elasticsearch yet
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Test log found in Elasticsearch
    set /a PASSED+=1
)
echo.

REM Test 9: Check indices exist
echo [TEST 9/10] Checking Elasticsearch indices...
curl -s "http://localhost:9200/_cat/indices?v" | findstr "ait-" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: No AIT indices found yet
    set /a FAILED+=1
) else (
    echo ✅ PASSED: AIT indices found
    set /a PASSED+=1
)
echo.

REM Test 10: Check Logstash pipeline stats
echo [TEST 10/10] Checking Logstash pipeline stats...
curl -s http://localhost:9600/_node/stats/pipelines | findstr "events" >nul 2>&1
if errorlevel 1 (
    echo ❌ FAILED: Could not get Logstash pipeline stats
    set /a FAILED+=1
) else (
    echo ✅ PASSED: Logstash pipeline stats available
    set /a PASSED+=1
)
echo.

REM Summary
echo =========================================
echo 📊 Validation Summary
echo =========================================
echo.
echo Total Tests: 10
echo ✅ Passed: %PASSED%
echo ❌ Failed: %FAILED%
echo.

if %FAILED% GTR 0 (
    echo ⚠️  Some tests failed. Please check:
    echo   1. Are all containers running? (docker ps)
    echo   2. Check container logs: docker logs ait-elasticsearch
    echo   3. Verify ports are not in use by other services
    echo   4. Review ELK_LOGGING_GUIDE.md troubleshooting section
    echo.
    exit /b 1
) else (
    echo 🎉 All tests passed! ELK Stack is fully operational.
    echo.
    echo Next steps:
    echo   1. Open Kibana: http://localhost:5601
    echo   2. Setup index patterns: setup-kibana.bat
    echo   3. Generate test logs: cd test ^&^& test-logs.bat
    echo   4. Start sending logs from applications
    echo.
)

pause
