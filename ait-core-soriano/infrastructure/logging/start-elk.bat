@echo off
REM ============================================================================
REM ELK Stack Startup Script for Windows
REM Inicia Elasticsearch, Logstash, Kibana y Filebeat
REM ============================================================================

echo =========================================
echo 🚀 Starting ELK Stack for AinTech
echo =========================================
echo.

cd /d "%~dp0"

REM Check if Docker is running
echo 🔍 Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✅ Docker is running
echo.

REM Stop any existing containers
echo 🛑 Stopping existing ELK containers...
docker-compose -f docker-compose.elk.yml down >nul 2>&1

REM Start ELK Stack
echo 🚀 Starting ELK Stack...
docker-compose -f docker-compose.elk.yml up -d

if errorlevel 1 (
    echo ❌ Failed to start ELK Stack
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to be healthy...
echo.

REM Wait for Elasticsearch (60 attempts * 2 seconds = 2 minutes)
echo 🔄 Waiting for Elasticsearch...
set /a counter=0
:wait_elasticsearch
set /a counter+=1
if %counter% gtr 60 (
    echo ❌ Elasticsearch failed to start
    pause
    exit /b 1
)
curl -s http://localhost:9200/_cluster/health >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_elasticsearch
)
echo ✅ Elasticsearch is ready
echo.

REM Wait for Logstash
echo 🔄 Waiting for Logstash...
set /a counter=0
:wait_logstash
set /a counter+=1
if %counter% gtr 60 (
    echo ❌ Logstash failed to start
    pause
    exit /b 1
)
curl -s http://localhost:9600 >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_logstash
)
echo ✅ Logstash is ready
echo.

REM Wait for Kibana
echo 🔄 Waiting for Kibana...
set /a counter=0
:wait_kibana
set /a counter+=1
if %counter% gtr 60 (
    echo ❌ Kibana failed to start
    pause
    exit /b 1
)
curl -s http://localhost:5601/api/status >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_kibana
)
echo ✅ Kibana is ready
echo.

REM Display service status
echo.
echo =========================================
echo ✅ ELK Stack is running!
echo =========================================
echo.
echo Services:
echo   📊 Elasticsearch: http://localhost:9200
echo   🔧 Logstash:
echo      - TCP:  localhost:5000
echo      - HTTP: localhost:8080
echo      - API:  http://localhost:9600
echo   📈 Kibana:        http://localhost:5601
echo.
echo Logs input endpoints:
echo   - TCP (JSON):  localhost:5000
echo   - HTTP (JSON): localhost:8080
echo   - Beats:       localhost:5044
echo.

REM Check cluster health
echo 🏥 Elasticsearch Cluster Health:
curl -s http://localhost:9200/_cluster/health?pretty 2>nul
echo.

echo =========================================
echo Next steps:
echo 1. Open Kibana: http://localhost:5601
echo 2. Configure index patterns (run setup-kibana.bat)
echo 3. Start sending logs from applications
echo =========================================
echo.

REM Open Kibana in browser
echo Opening Kibana in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5601

echo.
echo Press any key to view logs (or close to continue)...
pause >nul

docker-compose -f docker-compose.elk.yml logs -f
