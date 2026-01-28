@echo off
echo ╔════════════════════════════════════════════════════════════════╗
echo ║       EJECUTAR PORTAL MAPPER - CONEXIÓN REAL                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Este script ejecuta el Portal Mapper con browser automation real.
echo.
echo IMPORTANTE: Necesitarás ingresar:
echo   - URL del portal
echo   - Usuario (email)
echo   - Contraseña
echo.
echo El browser se abrirá y verás el proceso en tiempo real.
echo.
pause
echo.
python test_portal_mapper_real.py
echo.
pause
