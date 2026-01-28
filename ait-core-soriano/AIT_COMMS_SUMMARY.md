# 📱📞 AIT-COMMS - Sistema de Comunicaciones

**Sistema completo de comunicaciones empresariales para AIT-CORE**

---

## 🎯 **¿QUÉ ES AIT-COMMS?**

**AIT-COMMS** es el módulo de comunicaciones del ecosistema AIT-CORE que integra:

- 📱 **App móvil** (React Native/Expo)
- 📞 **Softphone VoIP** (Twilio Voice SDK)
- 🏢 **Centralita virtual PBX** (IVR, colas, grabación)
- 🎥 **Videollamadas WebRTC** (P2P, multi-participante)

---

## 📦 **COMPONENTES:**

### **1. @ait-core/ait-comms-mobile**
**App móvil multiplataforma (iOS/Android)**

```
apps/mobile/
├── app/                    # Pantallas (Expo Router)
│   ├── (tabs)/
│   │   ├── dashboard.tsx   # Dashboard
│   │   ├── video-calls.tsx # Videollamadas
│   │   ├── contacts.tsx    # Contactos
│   │   └── settings.tsx    # Configuración
│   └── video-call.tsx      # Pantalla de llamada activa
├── package.json
└── README.md
```

**Características:**
- ✅ Dashboard con métricas
- ✅ Videollamadas WebRTC P2P
- ✅ Softphone VoIP integrado
- ✅ Notificaciones push
- ✅ Dark mode
- ✅ Disponible en Expo Go

---

### **2. @ait-core/ait-comms-softphone**
**Librería de softphone VoIP para web/React**

```
packages/softphone/
├── src/
│   ├── TwilioSoftphone.ts      # Cliente principal
│   ├── types.ts                # TypeScript types
│   └── react/
│       ├── useSoftphone.tsx    # React Hook
│       └── SoftphoneWidget.tsx # Widget UI completo
├── package.json
└── README.md
```

**Uso:**
```tsx
import { SoftphoneWidget } from '@ait-core/ait-comms-softphone/react';

<SoftphoneWidget
  config={twilioConfig}
  onTokenRequest={fetchToken}
  autoConnect={true}
/>
```

---

### **3. @ait-core/ait-comms-telephony**
**Servicio backend de telefonía (Node.js/FastAPI)**

```
services/telephony/
├── src/
│   ├── main.ts                  # API FastAPI
│   ├── telephony.service.ts     # Lógica de llamadas
│   ├── ivr.service.ts           # IVR con menú español
│   ├── call-queue.service.ts    # Colas de llamadas
│   └── config.ts                # Configuración
├── Dockerfile
└── README.md
```

**Endpoints:**
- `POST /api/token` - Generar token Twilio
- `POST /api/calls/incoming` - Webhook llamadas entrantes
- `POST /api/calls/outgoing` - Webhook llamadas salientes
- `GET /api/calls/history` - Historial de llamadas
- `GET /api/recordings/:sid` - Obtener grabación
- `GET /api/queues/:id` - Estado de cola
- `POST /api/ivr/menu` - IVR

---

## 🚀 **INSTALACIÓN RÁPIDA:**

### **Paso 1: Configurar Twilio**
```bash
# 1. Crear cuenta en https://www.twilio.com/try-twilio
# 2. Comprar número telefónico (+34...)
# 3. Crear TwiML App
# 4. Generar API Key
```

### **Paso 2: Configurar proyecto**
```bash
# Copiar archivos .env
cp .env.example .env
cp services/telephony/.env.example services/telephony/.env
cp apps/mobile/.env.example apps/mobile/.env

# Editar .env con tus 6 credenciales de Twilio
nano .env
```

### **Paso 3: Validar y arrancar**
```bash
# Validar configuración
npm run setup-twilio

# Iniciar todo el sistema
npm run start:all              # Linux/Mac
npm run start:all:windows      # Windows
```

### **Paso 4: Probar app móvil**
```bash
cd apps/mobile
npm install
npm start
# Escanear QR con Expo Go
```

---

## 📋 **COMANDOS NPM:**

```json
{
  "scripts": {
    "setup-twilio": "node scripts/setup-twilio.js",
    "start:all": "bash scripts/start-all.sh",
    "start:all:windows": "scripts\\start-all.bat",
    "start:telephony": "cd services/telephony && npm run dev",
    "start:mobile": "cd apps/mobile && npm start"
  }
}
```

---

## 🏗️ **ARQUITECTURA:**

```
┌─────────────────────────────────────────────┐
│           AIT-COMMS ARCHITECTURE            │
└─────────────────────────────────────────────┘

┌─────────────────┐
│  Twilio Cloud   │ ← Red telefónica pública
│  (VoIP Gateway) │    (números reales)
└────────┬────────┘
         │ SIP/WebRTC
         │
    ┌────▼─────────────────────┐
    │  ait-comms-telephony     │ ← Backend (Node.js)
    │  - API REST              │
    │  - IVR System            │
    │  - Call Queues           │
    │  - Recording             │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │  Frontend Clients                 │
    ├───────────────────────────────────┤
    │ • ait-comms-mobile (iOS/Android)  │
    │ • ait-comms-softphone (Web)       │
    │ • Admin Panel                     │
    └───────────────────────────────────┘
         │
    ┌────▼────────┐
    │   Database  │
    │ PostgreSQL  │
    │   Redis     │
    └─────────────┘
```

---

## 🎯 **CASOS DE USO:**

### **1. Cliente llama a la empresa**
```
Cliente → Número Twilio → IVR
                           ├→ 1: Seguros vida → Agente
                           ├→ 2: Seguros salud → Agente
                           ├→ 3: Seguros hogar → Agente
                           ├→ 4: Seguros auto → Agente
                           └→ 9: Cola general → Siguiente disponible
```

### **2. Agente llama desde web**
```
Web Softphone → Twilio → Número cliente
                         ├→ Grabación automática
                         └→ Guardar historial
```

### **3. Agente en móvil hace videollamada**
```
App Móvil → WebRTC Signaling → Otro agente
            ├→ Video/Audio P2P
            ├→ Screen sharing
            └→ Cifrado E2E
```

---

## 🔧 **CONFIGURACIÓN:**

### **Variables de entorno (.env):**

```bash
# TWILIO (obligatorio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+34912345678
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxx

# DATABASE (defaults disponibles)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ait_core

# REDIS (defaults disponibles)
REDIS_HOST=localhost
REDIS_PORT=6379

# URLs
API_URL=http://localhost:3000
TELEPHONY_SERVICE_URL=http://localhost:3020
SIGNALING_URL=ws://localhost:1234/signaling
```

---

## 💰 **COSTOS (Twilio):**

| Concepto | Precio estimado |
|----------|----------------|
| **Número telefónico** | ~1€/mes |
| **Llamada entrante** | ~0.0085€/min |
| **Llamada saliente** | ~0.01€/min |
| **Grabación** | ~0.0025€/min |
| **Transcripción** (opcional) | ~0.05€/min |

**Ejemplo: 100 llamadas/mes de 10 min:**
- Número: 1€
- Llamadas: 9€
- Grabación: 0.25€
- **Total: ~10€/mes**

---

## 📊 **FUNCIONALIDADES:**

### **Softphone VoIP:**
- ✅ Llamadas salientes a cualquier número
- ✅ Recepción de llamadas entrantes
- ✅ Mute/unmute micrófono
- ✅ Teclado DTMF (0-9, *, #)
- ✅ Métricas de calidad (MOS, latency, jitter)
- ✅ Widget flotante para web
- ✅ React Hook para integración custom

### **Centralita Virtual (PBX):**
- ✅ IVR multinivel en español
- ✅ Cola de llamadas con Redis
- ✅ Distribución automática a agentes
- ✅ Música en espera
- ✅ Grabación automática de llamadas
- ✅ Transcripción automática (opcional)
- ✅ Historial completo en PostgreSQL

### **App Móvil:**
- ✅ Videollamadas WebRTC
- ✅ Softphone VoIP integrado
- ✅ Dashboard con métricas
- ✅ Lista de contactos
- ✅ Notificaciones push
- ✅ Dark mode
- ✅ iOS + Android (Expo)

### **Videollamadas WebRTC:**
- ✅ Peer-to-peer (baja latencia)
- ✅ Audio + Video HD
- ✅ Screen sharing
- ✅ Multi-participante
- ✅ Cifrado E2E (DTLS-SRTP)
- ✅ Indicador de calidad
- ✅ Controles de audio/video

---

## 📚 **DOCUMENTACIÓN:**

| Archivo | Descripción |
|---------|-------------|
| **[START_HERE.md](START_HERE.md)** | 👈 Punto de entrada principal |
| **[QUICK_START.md](QUICK_START.md)** | Guía rápida (3 pasos, 22 min) |
| **[SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)** | Guía completa detallada |
| **[README_COMMUNICATIONS.md](README_COMMUNICATIONS.md)** | Resumen técnico |
| **[apps/mobile/README.md](apps/mobile/README.md)** | Docs de app móvil |
| **[packages/softphone/README.md](packages/softphone/README.md)** | Docs de softphone |
| **[services/telephony/README.md](services/telephony/README.md)** | Docs de telefonía |

---

## 🧪 **TESTING:**

### **1. Validar configuración**
```bash
npm run setup-twilio
# Debe retornar: ✅ CONFIGURACIÓN COMPLETA
```

### **2. Test de servicio**
```bash
curl http://localhost:3020/health
# Respuesta: {"status":"ok","service":"telephony"}
```

### **3. Test de token**
```bash
curl -X POST http://localhost:3020/api/token \
  -H "Content-Type: application/json" \
  -d '{"identity":"test-user"}'
# Respuesta: {"token":"eyJ0eXAi...","identity":"test-user"}
```

### **4. Test de llamada**
```bash
# Desde softphone o móvil, llamar a tu número de Twilio
# Deberías escuchar: "Bienvenido a AIT-CORE Soriano Mediadores..."
```

---

## 🐛 **TROUBLESHOOTING:**

| Problema | Solución |
|----------|----------|
| No se encuentra .env | `cp .env.example .env` |
| Invalid credentials | Verificar valores en .env con Twilio Console |
| Port 3020 in use | `lsof -i :3020` y matar proceso |
| Device not initialized | Esperar a que servicio esté listo |
| Microphone denied | Dar permisos en browser/móvil settings |
| Call not connecting | Verificar webhooks en Twilio Console |

---

## 🔒 **SEGURIDAD:**

- ✅ Todas las llamadas VoIP cifradas (SRTP)
- ✅ Videollamadas WebRTC cifradas E2E (DTLS)
- ✅ Tokens JWT con expiración (1 hora)
- ✅ Webhooks con validación de firma Twilio
- ✅ HTTPS obligatorio en producción
- ✅ Permisos de micrófono/cámara gestionados

---

## 📈 **MÉTRICAS Y ANALYTICS:**

El sistema registra:
- 📊 Historial completo de llamadas
- ⏱️ Duración y calidad (MOS score)
- 💰 Costos por llamada
- 📞 Llamadas por agente
- 🕐 Tiempo en cola
- 📋 Distribución por IVR

**Consulta:**
```bash
GET /api/calls/history?userId=agent-123&limit=100
```

---

## 🚀 **DEPLOYMENT:**

### **Docker Compose:**
```yaml
services:
  ait-comms-telephony:
    image: ait-core/ait-comms-telephony:latest
    ports:
      - "3020:3020"
    environment:
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      # ...
```

### **Kubernetes:**
```bash
kubectl apply -f k8s/ait-comms/
```

### **Vercel/Railway (móvil):**
```bash
cd apps/mobile
eas build --platform android
eas build --platform ios
eas submit
```

---

## 🎯 **ROADMAP:**

### **v1.0 (Actual)** ✅
- Softphone VoIP funcional
- Centralita con IVR
- App móvil básica
- Videollamadas P2P

### **v1.1 (Próximo)**
- [ ] Grabación de videollamadas
- [ ] Transcripción en tiempo real
- [ ] Dashboard de analytics
- [ ] Integración con CRM

### **v1.2 (Futuro)**
- [ ] Conference calls (multi-participante)
- [ ] Virtual backgrounds
- [ ] Noise cancellation con IA
- [ ] Call center completo

---

## 🤝 **CONTRIBUIR:**

```bash
# Fork el proyecto
git clone https://github.com/your-org/ait-core-soriano

# Crear rama para feature
git checkout -b feature/ait-comms-improvement

# Commit cambios
git commit -m "feat(ait-comms): add new feature"

# Push y crear PR
git push origin feature/ait-comms-improvement
```

---

## 📝 **LICENCIA:**

**Proprietary** - AIN TECH / Soriano Mediadores

---

## 💬 **SOPORTE:**

- 📧 Email: support@ait-core.com
- 💬 GitHub: [Issues](https://github.com/your-org/ait-core-soriano/issues)
- 📚 Docs: [Documentación completa](docs/)
- 🌐 Web: https://ait-core.com

---

## 🏆 **CRÉDITOS:**

**Desarrollado por**: AIT-CORE Development Team
**Powered by**: Twilio, Expo, React Native, WebRTC
**Versión**: 1.0.0
**Fecha**: 2026-01-28

---

**¿Listo para empezar?**

👉 [START_HERE.md](START_HERE.md)

---

© 2026 AIN TECH - Soriano Mediadores. Todos los derechos reservados.
