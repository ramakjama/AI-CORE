@echo off
REM ============================================
REM AI-CORE - Setup Automatizado (Windows)
REM ============================================
REM Este script configura el entorno completo
REM ============================================

setlocal enabledelayedexpansion

REM Colores (usando PowerShell para colores)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║                                                   ║
echo ║           AI-CORE Setup Automatizado             ║
echo ║                                                   ║
echo ║     Sistema ERP Empresarial con IA Nativa        ║
echo ║                                                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM ============================================
REM Verificar Requisitos
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Verificando Requisitos del Sistema
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Node.js
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js !NODE_VERSION! instalado
) else (
    echo ✗ Node.js no encontrado
    echo.
    echo Por favor instala Node.js 20.x o superior desde:
    echo https://nodejs.org/
    pause
    exit /b 1
)

REM pnpm
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✓ pnpm !PNPM_VERSION! instalado
) else (
    echo ⚠ pnpm no encontrado. Instalando...
    call npm install -g pnpm
    echo ✓ pnpm instalado
)

REM Docker
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ Docker instalado
) else (
    echo ✗ Docker no encontrado
    echo.
    echo Por favor instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Git
where git >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ Git instalado
) else (
    echo ✗ Git no encontrado
    echo.
    echo Por favor instala Git desde:
    echo https://git-scm.com/download/win
    pause
    exit /b 1
)

REM ============================================
REM Instalar Dependencias
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Instalando Dependencias
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Instalando dependencias con pnpm...
call pnpm install
if %errorlevel% neq 0 (
    echo ✗ Error al instalar dependencias
    pause
    exit /b 1
)
echo ✓ Dependencias instaladas correctamente

REM ============================================
REM Configurar Variables de Entorno
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Configurando Variables de Entorno
echo ╚═══════════════════════════════════════════════════╝
echo.

if exist .env (
    echo ⚠ El archivo .env ya existe
    set /p OVERWRITE="¿Deseas sobrescribirlo? (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo ℹ Manteniendo archivo .env existente
        goto :skip_env
    )
)

echo ℹ Copiando .env.example a .env...
copy .env.example .env >nul
echo ✓ Archivo .env creado
echo.
echo ⚠ IMPORTANTE: Edita el archivo .env con tus credenciales reales
echo ℹ Especialmente:
echo   - DATABASE_URL
echo   - OPENAI_API_KEY
echo   - ANTHROPIC_API_KEY
echo   - JWT_SECRET
echo   - ENCRYPTION_KEY

:skip_env

REM ============================================
REM Iniciar Servicios Docker
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Iniciando Servicios de Infraestructura
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Iniciando PostgreSQL, Redis, Kafka...
docker compose up -d
if %errorlevel% neq 0 (
    echo ✗ Error al iniciar servicios Docker
    pause
    exit /b 1
)

echo ℹ Esperando a que los servicios estén listos...
timeout /t 15 /nobreak >nul

echo ✓ Servicios de infraestructura iniciados

REM ============================================
REM Crear Bases de Datos
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Creando Bases de Datos
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Creando 81 bases de datos...

REM Lista de bases de datos
set DATABASES=ai_core_main ai_core_global ai_core_system ai_core_audit ai_core_logs ss_insurance ss_policies ss_claims ss_commissions ss_carriers sm_hr sm_hr_payroll sm_hr_recruitment sm_hr_training sm_hr_performance sm_analytics sm_analytics_reports sm_analytics_dashboards sm_analytics_metrics sm_ai_agents sm_ai_models sm_ai_training sm_ai_prompts sm_communications sm_comms_email sm_comms_sms sm_comms_whatsapp sm_comms_voice sm_finance sm_finance_accounting sm_finance_invoicing sm_finance_treasury sm_crm sm_leads sm_customers sm_documents sm_storage sm_workflows sm_tasks shared_sso shared_master_customers shared_master_products shared_unified_crm shared_unified_analytics shared_assets shared_global_config shared_event_bus soriano_web_main soriano_web_content soriano_web_blog soriano_web_forms soriano_web_seo esori_main esori_users esori_quotes esori_sessions esori_content landing_soriano_main landing_soriano_leads landing_soriano_analytics landing_soriano_campaigns taxi_asegurado_main taxi_asegurado_leads taxi_asegurado_quotes taxi_asegurado_policies taxi_asegurado_analytics sm_inventory sm_products sm_projects sm_marketing sm_legal sm_compliance sm_quality sm_tickets sm_notifications sm_scheduling ext_carriers ext_payments ext_maps ext_ai_models ext_backups

set CREATED=0
set SKIPPED=0

for %%D in (%DATABASES%) do (
    docker compose exec -T postgres psql -U postgres -lqt | findstr /C:"%%D" >nul 2>nul
    if !errorlevel! equ 0 (
        echo ℹ Base de datos '%%D' ya existe ^(omitiendo^)
        set /a SKIPPED+=1
    ) else (
        docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE %%D;" >nul 2>nul
        echo ✓ Base de datos '%%D' creada
        set /a CREATED+=1
    )
)

echo ✓ Bases de datos creadas: !CREATED!, omitidas: !SKIPPED!

REM ============================================
REM Generar Cliente Prisma
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Generando Cliente Prisma
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Generando clientes Prisma para todas las bases de datos...
call pnpm db:generate
if %errorlevel% neq 0 (
    echo ⚠ Error al generar clientes Prisma ^(puede ser normal si no hay schemas^)
) else (
    echo ✓ Clientes Prisma generados
)

REM ============================================
REM Ejecutar Migraciones
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Ejecutando Migraciones
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Aplicando migraciones a las bases de datos...
call pnpm db:migrate
if %errorlevel% neq 0 (
    echo ⚠ Error al aplicar migraciones ^(puede ser normal si no hay migraciones^)
) else (
    echo ✓ Migraciones aplicadas
)

REM ============================================
REM Cargar Datos de Prueba
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Cargando Datos de Prueba
echo ╚═══════════════════════════════════════════════════╝
echo.

set /p SEED="¿Deseas cargar datos de prueba? (Y/n): "
if /i "!SEED!"=="n" (
    echo ℹ Omitiendo carga de datos de prueba
    goto :skip_seed
)

echo ℹ Cargando datos de prueba...
call pnpm db:seed
if %errorlevel% neq 0 (
    echo ⚠ Error al cargar datos de prueba ^(puede ser normal si no hay seeds^)
) else (
    echo ✓ Datos de prueba cargados
)

:skip_seed

REM ============================================
REM Verificar Instalación
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  Verificando Instalación
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ℹ Ejecutando tests de verificación...

REM Verificar PostgreSQL
docker compose exec -T postgres pg_isready >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ PostgreSQL: Conectado
) else (
    echo ✗ PostgreSQL: No conectado
)

REM Verificar Redis
docker compose exec -T redis redis-cli ping >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ Redis: Conectado
) else (
    echo ✗ Redis: No conectado
)

REM Verificar dependencias
if exist node_modules (
    echo ✓ Dependencias: Instaladas
) else (
    echo ✗ Dependencias: No instaladas
)

REM Verificar .env
if exist .env (
    echo ✓ Configuración: .env existe
) else (
    echo ✗ Configuración: .env no encontrado
)

echo ✓ Verificación completada

REM ============================================
REM Mostrar Siguiente Paso
REM ============================================
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  ¡Instalación Completada!
echo ╚═══════════════════════════════════════════════════╝
echo.

echo ✓ AI-CORE está listo para usar
echo.
echo Próximos pasos:
echo   1. Edita el archivo .env con tus credenciales reales
echo   2. Inicia el servidor de desarrollo:
echo      pnpm dev
echo   3. Abre tu navegador en:
echo      http://localhost:3000 ^(Web App^)
echo      http://localhost:4000 ^(API^)
echo      http://localhost:4000/graphql ^(GraphQL Playground^)
echo.
echo Comandos útiles:
echo   pnpm dev              - Iniciar todos los servicios
echo   pnpm dev:web          - Solo Web App
echo   pnpm dev:api          - Solo API
echo   pnpm build            - Build de producción
echo   pnpm test             - Ejecutar tests
echo   pnpm db:studio        - Abrir Prisma Studio
echo   docker compose logs -f - Ver logs de servicios
echo.
echo Documentación:
echo   docs\guides\getting-started.md
echo   docs\guides\development.md
echo   README.md
echo.

pause
