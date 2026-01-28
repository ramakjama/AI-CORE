@echo off
REM ============================================================================
REM ELK Stack Health Check Script for Windows
REM ============================================================================

echo =========================================
echo 🏥 ELK Stack Health Check
echo =========================================
echo.

cd /d "%~dp0"

echo 🔍 Checking Docker containers...
docker-compose -f docker-compose.elk.yml ps
echo.

echo 📊 Elasticsearch Health:
echo =========================================
curl -s http://localhost:9200/_cluster/health?pretty
echo.

echo 📊 Elasticsearch Indices:
echo =========================================
curl -s "http://localhost:9200/_cat/indices?v&s=index"
echo.

echo 🔧 Logstash Stats:
echo =========================================
curl -s http://localhost:9600/_node/stats/pipelines?pretty
echo.

echo 📈 Kibana Status:
echo =========================================
curl -s http://localhost:5601/api/status | findstr "state\|level"
echo.

echo =========================================
echo Health check complete
echo =========================================
echo.
pause
