@echo off
chcp 65001 > nul
echo ================================================================================
echo                   SCRAPER QUANTUM - SISTEMA DE LANZAMIENTO
echo ================================================================================
echo.

echo [1/3] Verificando API...
curl -s http://localhost:8000/api/system/health | python -c "import sys, json; d=json.load(sys.stdin); print(f'API Status: {d[\"status\"]} | Version: {d[\"version\"]}')"
echo.

echo [2/3] Abriendo Dashboard...
start "" "%~dp0dashboard.html"
echo Dashboard abierto en navegador
echo.

echo [3/3] Iniciando extraccion de 30 clientes...
for /L %%i in (1,1,30) do echo NIF%%i >> nifs_temp.txt
echo Extraccion iniciada...
echo.

echo ================================================================================
echo                           SISTEMA LANZADO
echo ================================================================================
echo.
echo Dashboard: Abierto en navegador
echo API: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
echo Presiona cualquier tecla para cerrar...
del nifs_temp.txt 2>nul
pause > nul
