@echo off
REM Script para generar todos los clientes Prisma de las bases de datos
REM AI-CORE - Soriano Mediadores

echo.
echo ========================================
echo   GENERADOR DE CLIENTES PRISMA
echo   AI-CORE - Todas las Bases de Datos
echo ========================================
echo.

setlocal enabledelayedexpansion

set total=0
set success=0
set failed=0

REM Lista de bases de datos
set databases=sm_global sm_auth sm_audit sm_analytics sm_communications sm_documents sm_ai_agents sm_accounting sm_commercial sm_compliance sm_data_quality sm_hr sm_integrations sm_inventory sm_leads sm_legal sm_marketing sm_notifications sm_objectives sm_products sm_projects sm_quality sm_scheduling sm_strategy sm_techteam sm_tickets sm_workflows ss_insurance ss_commissions ss_endorsements ss_retention ss_vigilance se_energy st_telecom sf_finance sr_repairs sw_workshops soriano_ecliente soriano_web_premium ai_core ai_super_app

for %%d in (%databases%) do (
    set /a total+=1
    echo.
    echo [!total!] Procesando: %%d
    echo ----------------------------------------
    
    if exist "..\databases\%%d" (
        cd "..\databases\%%d"
        
        if exist "prisma\schema.prisma" (
            echo Generando cliente Prisma...
            call npx prisma generate
            
            if !errorlevel! equ 0 (
                echo [32m✓ %%d - Cliente generado exitosamente[0m
                set /a success+=1
            ) else (
                echo [31m✗ %%d - Error al generar cliente[0m
                set /a failed+=1
            )
        ) else (
            echo [33m! %%d - No se encontro schema.prisma[0m
            set /a failed+=1
        )
        
        cd "%~dp0"
    ) else (
        echo [33m! %%d - Directorio no encontrado[0m
        set /a failed+=1
    )
)

echo.
echo ========================================
echo   RESUMEN DE GENERACION
echo ========================================
echo Total de bases de datos: !total!
echo [32mExitosos: !success![0m
echo [31mFallidos: !failed![0m
echo ========================================
echo.

if !failed! equ 0 (
    echo [32m¡Todos los clientes Prisma generados exitosamente![0m
    exit /b 0
) else (
    echo [33mAlgunos clientes fallaron. Revisa los errores arriba.[0m
    exit /b 1
)
