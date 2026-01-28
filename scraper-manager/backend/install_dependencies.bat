@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║    INSTALACIÓN DE DEPENDENCIAS - Portal Mapper con Playwright ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Instalando dependencias de Python...
pip install -r requirements.txt

echo.
echo [2/3] Instalando navegadores de Playwright...
playwright install chromium

echo.
echo [3/3] Verificando instalación...
python -c "import playwright; print('✅ Playwright instalado correctamente')"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                   INSTALACIÓN COMPLETADA                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Ahora puedes ejecutar el portal mapper con conexión REAL al portal
echo.
pause
