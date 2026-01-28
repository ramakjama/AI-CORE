#!/bin/bash

# Start All Services Script
# Inicia todos los servicios necesarios para el sistema completo

set -e

echo "🚀 Iniciando AIT-CORE Sistema Completo..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: No se encontró el archivo .env${NC}"
    echo -e "${YELLOW}Ejecuta: cp .env.example .env${NC}"
    echo -e "${YELLOW}Y configura tus credenciales de Twilio${NC}"
    exit 1
fi

# Validate Twilio config
echo -e "${BLUE}🔍 Validando configuración de Twilio...${NC}"
node scripts/setup-twilio.js
if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Configuración validada${NC}"
echo ""

# Start Docker services (DB, Redis, etc)
echo -e "${BLUE}🐳 Iniciando servicios Docker...${NC}"
docker-compose up -d postgres redis kafka elasticsearch

echo ""
echo -e "${GREEN}✅ Servicios Docker iniciados${NC}"
echo ""

# Wait for services to be ready
echo -e "${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Start Telephony Service
echo -e "${BLUE}📞 Iniciando servicio de telefonía...${NC}"
cd services/telephony
npm install > /dev/null 2>&1
npm run dev &
TELEPHONY_PID=$!
cd ../..

echo -e "${GREEN}✅ Servicio de telefonía iniciado (PID: $TELEPHONY_PID)${NC}"
echo ""

# Start API Gateway
echo -e "${BLUE}🌐 Iniciando API Gateway...${NC}"
cd apps/api
npm install > /dev/null 2>&1
npm run dev &
API_PID=$!
cd ../..

echo -e "${GREEN}✅ API Gateway iniciado (PID: $API_PID)${NC}"
echo ""

# Start Web App
echo -e "${BLUE}🖥️  Iniciando app web...${NC}"
cd apps/web
npm install > /dev/null 2>&1
npm run dev &
WEB_PID=$!
cd ../..

echo -e "${GREEN}✅ App web iniciada (PID: $WEB_PID)${NC}"
echo ""

# Print summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ SISTEMA COMPLETAMENTE INICIADO    ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📱 App Web:${NC}         http://localhost:3000"
echo -e "${BLUE}📞 Telefonía:${NC}       http://localhost:3020"
echo -e "${BLUE}🔌 API Gateway:${NC}     http://localhost:3000/api"
echo ""
echo -e "${YELLOW}💡 Para la app móvil:${NC}"
echo -e "   cd apps/mobile"
echo -e "   npm start"
echo ""
echo -e "${YELLOW}🛑 Para detener todos los servicios:${NC}"
echo -e "   npm run stop:all"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Keep script running
wait
