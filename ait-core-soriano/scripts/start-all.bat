@echo off
REM Start All Services Script (Windows)
REM Inicia todos los servicios necesarios para el sistema completo

echo.
echo 🚀 Iniciando AIT-CORE Sistema Completo...
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ Error: No se encontró el archivo .env
    echo Ejecuta: copy .env.example .env
    echo Y configura tus credenciales de Twilio
    exit /b 1
)

REM Validate Twilio config
echo 🔍 Validando configuración de Twilio...
node scripts\setup-twilio.js
if errorlevel 1 exit /b 1

echo.
echo ✅ Configuración validada
echo.

REM Start Docker services
echo 🐳 Iniciando servicios Docker...
docker-compose up -d postgres redis kafka elasticsearch

echo.
echo ✅ Servicios Docker iniciados
echo.

REM Wait for services
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 5 /nobreak > nul

REM Start Telephony Service
echo 📞 Iniciando servicio de telefonía...
start /B cmd /c "cd services\telephony && npm install && npm run dev"

timeout /t 2 /nobreak > nul
echo ✅ Servicio de telefonía iniciado
echo.

REM Start API Gateway
echo 🌐 Iniciando API Gateway...
start /B cmd /c "cd apps\api && npm install && npm run dev"

timeout /t 2 /nobreak > nul
echo ✅ API Gateway iniciado
echo.

REM Start Web App
echo 🖥️  Iniciando app web...
start /B cmd /c "cd apps\web && npm install && npm run dev"

timeout /t 2 /nobreak > nul
echo ✅ App web iniciada
echo.

REM Print summary
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo    ✅ SISTEMA COMPLETAMENTE INICIADO
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📱 App Web:         http://localhost:3000
echo 📞 Telefonía:       http://localhost:3020
echo 🔌 API Gateway:     http://localhost:3000/api
echo.
echo 💡 Para la app móvil:
echo    cd apps\mobile
echo    npm start
echo.
echo 🛑 Para detener: Ctrl+C o cierra esta ventana
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

pause
