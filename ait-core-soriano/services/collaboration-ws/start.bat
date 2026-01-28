@echo off
REM Collaboration WebSocket Server Start Script for Windows

echo ========================================
echo   AIT-CORE Collaboration WebSocket
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo No .env file found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
)

REM Get port from env or use default
set WS_PORT=1234
if defined WS_PORT (
    echo Port: %WS_PORT%
) else (
    echo Port: 1234
)

echo Starting server...
echo.

REM Start server
node server.js
