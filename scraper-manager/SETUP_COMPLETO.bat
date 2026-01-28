@echo off
chcp 65001 >nul
title Setup Completo - Scraper Quantum

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║           🔧 SETUP COMPLETO - SCRAPER QUANTUM 🔧                          ║
echo ║                                                                           ║
echo ║    Este script configurará TODA la infraestructura necesaria:            ║
echo ║    • Python + Dependencias                                               ║
echo ║    • Node.js + Dependencias                                              ║
echo ║    • Bases de Datos (PostgreSQL, Redis, MongoDB, etc.)                   ║
echo ║    • Configuración inicial                                               ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
pause

cd /d "%~dp0"

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 1/8: Verificando requisitos del sistema
echo ═══════════════════════════════════════════════════════════════════════════
echo.

:: Verificar Python
echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no instalado
    echo.
    echo Descarga Python 3.12+ desde: https://www.python.org/downloads/
    echo Asegúrate de marcar "Add Python to PATH" durante la instalación
    pause
    exit /b 1
)
python --version
echo ✅ Python instalado

:: Verificar Node.js
echo.
echo [2/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no instalado
    echo.
    echo Descarga Node.js 20+ desde: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo ✅ Node.js instalado

:: Verificar npm
echo.
echo [3/4] Verificando npm...
npm --version
echo ✅ npm instalado

:: Verificar Git
echo.
echo [4/4] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Git no instalado (opcional)
) else (
    git --version
    echo ✅ Git instalado
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 2/8: Creando entorno virtual de Python
echo ═══════════════════════════════════════════════════════════════════════════
echo.

if exist "venv" (
    echo ⚠️  Entorno virtual ya existe, omitiendo...
) else (
    echo Creando entorno virtual...
    python -m venv venv
    echo ✅ Entorno virtual creado
)

echo.
echo Activando entorno virtual...
call venv\Scripts\activate.bat
echo ✅ Entorno virtual activado

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 3/8: Instalando dependencias de Python
echo ═══════════════════════════════════════════════════════════════════════════
echo.

echo Actualizando pip...
python -m pip install --upgrade pip --quiet

echo.
echo Instalando dependencias (esto puede tardar unos minutos)...
pip install playwright asyncio aiohttp --quiet
pip install redis elasticsearch neo4j psycopg[pool] pymongo --quiet
pip install pydantic fastapi uvicorn[standard] --quiet
pip install pillow pytesseract pdf2image --quiet
pip install pandas openpyxl xlsxwriter --quiet
pip install python-multipart python-dotenv --quiet
pip install openai anthropic groq --quiet
pip install prometheus-client --quiet

echo ✅ Dependencias de Python instaladas

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 4/8: Instalando navegadores de Playwright
echo ═══════════════════════════════════════════════════════════════════════════
echo.

echo Instalando Chromium (esto puede tardar varios minutos)...
playwright install chromium
echo ✅ Chromium instalado

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 5/8: Instalando dependencias de Node.js
echo ═══════════════════════════════════════════════════════════════════════════
echo.

if exist "frontend\package.json" (
    echo Instalando dependencias del frontend...
    cd frontend
    call npm install --quiet
    cd ..
    echo ✅ Dependencias del frontend instaladas
) else (
    echo ⚠️  No se encontró frontend/package.json
)

if exist "package.json" (
    echo.
    echo Instalando dependencias del root...
    call npm install --quiet
    echo ✅ Dependencias del root instaladas
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 6/8: Configurando bases de datos
echo ═══════════════════════════════════════════════════════════════════════════
echo.

echo [1/5] PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL no detectado
    echo.
    echo Para instalar PostgreSQL:
    echo 1. Descarga desde: https://www.postgresql.org/download/windows/
    echo 2. Instala con password: Bruma01_
    echo 3. Reinicia este script
) else (
    psql --version
    echo ✅ PostgreSQL instalado

    echo.
    echo Creando base de datos scraper_manager...
    psql -U postgres -c "CREATE DATABASE scraper_manager;" 2>nul
    if errorlevel 1 (
        echo ⚠️  Base de datos ya existe o error al crear
    ) else (
        echo ✅ Base de datos creada
    )
)

echo.
echo [2/5] Redis...
redis-cli --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Redis no detectado
    echo.
    echo Para instalar Redis en Windows:
    echo 1. Descarga desde: https://github.com/microsoftarchive/redis/releases
    echo 2. Instala Redis-x64-3.0.504.msi
    echo 3. Inicia el servicio Redis
) else (
    redis-cli --version
    echo ✅ Redis instalado
)

echo.
echo [3/5] MongoDB...
mongo --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB no detectado (opcional)
    echo    Puedes instalarlo más tarde desde: https://www.mongodb.com/try/download/community
) else (
    mongo --version
    echo ✅ MongoDB instalado
)

echo.
echo [4/5] Elasticsearch...
echo ⚠️  Elasticsearch debe ser instalado manualmente
echo    Descarga desde: https://www.elastic.co/downloads/elasticsearch

echo.
echo [5/5] Neo4j...
echo ⚠️  Neo4j debe ser instalado manualmente
echo    Descarga Neo4j Desktop desde: https://neo4j.com/download/

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 7/8: Configurando archivos de entorno
echo ═══════════════════════════════════════════════════════════════════════════
echo.

if exist ".env" (
    echo ⚠️  .env ya existe, no se sobrescribirá
) else (
    if exist ".env.example" (
        echo Copiando .env.example a .env...
        copy .env.example .env >nul
        echo ✅ Archivo .env creado
        echo.
        echo ⚠️  IMPORTANTE: Edita .env y configura tus credenciales
    ) else (
        echo Creando .env básico...
        (
            echo PORTAL_URL=https://portaloccident.gco.global
            echo PORTAL_USERNAME=b5454085
            echo PORTAL_PASSWORD=Bruma01_
            echo.
            echo DATABASE_URL=postgresql://postgres:Bruma01_@localhost:5432/scraper_manager
            echo REDIS_URL=redis://localhost:6379
            echo.
            echo NUM_WORKERS=3
            echo HEADLESS=true
            echo LOG_LEVEL=INFO
        ) > .env
        echo ✅ Archivo .env básico creado
    )
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo  PASO 8/8: Creando estructura de directorios
echo ═══════════════════════════════════════════════════════════════════════════
echo.

echo Creando directorios necesarios...
mkdir output 2>nul
mkdir output\documentos 2>nul
mkdir output\datos 2>nul
mkdir output\screenshots 2>nul
mkdir output\logs 2>nul
mkdir logs 2>nul
mkdir temp 2>nul

echo ✅ Estructura de directorios creada

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo ✅ ¡SETUP COMPLETADO EXITOSAMENTE!
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Próximos pasos:
echo.
echo 1. Edita el archivo .env con tus configuraciones
echo 2. Asegúrate de que PostgreSQL y Redis estén corriendo
echo 3. Ejecuta: EJECUTAR_SCRAPER_QUANTUM.bat
echo.
echo Documentación completa:
echo   • README_PRODUCCION.md
echo   • SCRAPER_DEFINITIVO_EXTRAORDINARIO.md
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause
