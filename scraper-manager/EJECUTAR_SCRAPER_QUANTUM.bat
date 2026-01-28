@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║     🚀 SCRAPER QUANTUM - SISTEMA DE EXTRACCIÓN DEFINITIVO 🚀             ║
echo ║                                                                           ║
echo ║           Portal: Occident (portaloccident.gco.global)                   ║
echo ║           Usuario: b5454085                                              ║
echo ║           Modo: PRODUCCIÓN ULTRA-MEJORADA                                ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

:: Verificar Python
echo 📦 Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python no está instalado o no está en PATH
    echo    Instala Python 3.12+ desde: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python instalado correctamente
echo.

:: Verificar Node.js
echo 📦 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo    Instala Node.js 20+ desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado correctamente
echo.

:: Ir al directorio del scraper
cd /d "%~dp0"

:: Verificar si existe el entorno virtual
if not exist "venv" (
    echo 🔧 Creando entorno virtual de Python...
    python -m venv venv
    echo ✅ Entorno virtual creado
    echo.
)

:: Activar entorno virtual
echo 🔄 Activando entorno virtual...
call venv\Scripts\activate.bat
echo.

:: Instalar dependencias de Python
echo 📦 Instalando dependencias de Python...
pip install --upgrade pip >nul 2>&1
pip install ^
    playwright ^
    redis[asyncio] ^
    elasticsearch ^
    psycopg[pool] ^
    neo4j ^
    pydantic ^
    fastapi ^
    uvicorn ^
    pillow ^
    pytesseract ^
    python-multipart ^
    --quiet

echo ✅ Dependencias de Python instaladas
echo.

:: Instalar Playwright Browsers
echo 🌐 Instalando navegadores de Playwright...
playwright install chromium --quiet
echo ✅ Navegadores instalados
echo.

:: Verificar servicios necesarios
echo 🔍 Verificando servicios...
echo.

:: Verificar PostgreSQL
echo    🐘 PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  PostgreSQL no detectado - Se intentará conectar de todas formas
) else (
    echo    ✅ PostgreSQL disponible
)

:: Verificar Redis
echo    🔴 Redis...
redis-cli --version >nul 2>&1
if errorlevel 1 (
    echo    ⚠️  Redis no detectado - Funcionalidad de caché limitada
) else (
    echo    ✅ Redis disponible
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo 🎯 OPCIONES DE EJECUCIÓN:
echo.
echo    [1] Ejecutar Scraper Completo (10 clientes de prueba)
echo    [2] Ejecutar Scraper con NIFs personalizados
echo    [3] Ejecutar Dashboard Web (Interfaz visual)
echo    [4] Ejecutar API REST (Backend solamente)
echo    [5] Ejecutar Sistema Completo (API + Dashboard + Scraper)
echo    [6] Ver documentación
echo    [7] Salir
echo.
set /p opcion="Selecciona una opción (1-7): "

if "%opcion%"=="1" goto :ejecutar_scraper_prueba
if "%opcion%"=="2" goto :ejecutar_scraper_custom
if "%opcion%"=="3" goto :ejecutar_dashboard
if "%opcion%"=="4" goto :ejecutar_api
if "%opcion%"=="5" goto :ejecutar_completo
if "%opcion%"=="6" goto :ver_docs
if "%opcion%"=="7" goto :salir

echo ❌ Opción inválida
pause
exit /b 1

:ejecutar_scraper_prueba
echo.
echo 🚀 Ejecutando Scraper con 10 clientes de prueba...
echo.
python backend\src\core\quantum_director.py
goto :fin

:ejecutar_scraper_custom
echo.
echo 📝 Ingresa los NIFs separados por comas (ej: 12345678A,87654321B,11111111C)
set /p nifs="NIFs: "
echo.
echo 🚀 Ejecutando Scraper...
python backend\src\core\quantum_director.py --nifs=%nifs%
goto :fin

:ejecutar_dashboard
echo.
echo 🌐 Iniciando Dashboard Web...
echo    URL: http://localhost:54112
echo.
cd frontend
call npm install --quiet
call npm run dev
goto :fin

:ejecutar_api
echo.
echo 🔌 Iniciando API REST...
echo    URL: http://localhost:8000
echo    Docs: http://localhost:8000/docs
echo.
uvicorn backend.src.api.main:app --reload --port 8000
goto :fin

:ejecutar_completo
echo.
echo 🚀 INICIANDO SISTEMA COMPLETO...
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo    Se iniciarán 3 procesos:
echo    1. 🔌 API REST (Puerto 8000)
echo    2. 🌐 Dashboard Web (Puerto 54112)
echo    3. 🤖 Scraper Quantum
echo.
echo    Presiona Ctrl+C en cualquier ventana para detener todo
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause

:: Iniciar API en nueva ventana
start "API REST - Scraper Quantum" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn backend.src.api.main:app --reload --port 8000"

:: Esperar 3 segundos
timeout /t 3 /nobreak >nul

:: Iniciar Dashboard en nueva ventana
start "Dashboard Web - Scraper Quantum" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Esperar 5 segundos
timeout /t 5 /nobreak >nul

:: Ejecutar scraper en ventana actual
echo.
echo 🚀 Iniciando Scraper Quantum...
echo.
python backend\src\core\quantum_director.py

goto :fin

:ver_docs
echo.
echo 📚 Abriendo documentación...
start "" "SCRAPER_DEFINITIVO_EXTRAORDINARIO.md"
echo.
echo Documentación abierta en tu editor predeterminado
pause
goto :fin

:salir
echo.
echo 👋 Saliendo...
exit /b 0

:fin
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo ✅ EJECUCIÓN COMPLETADA
echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause
