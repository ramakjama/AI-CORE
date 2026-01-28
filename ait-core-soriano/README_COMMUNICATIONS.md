# 📱📞 SISTEMA DE COMUNICACIONES - README

**App Móvil + Softphone VoIP + Centralita Virtual**

---

## 🎉 **¡NUEVO! Sistema completo de comunicaciones**

### **✅ Implementado y listo para usar:**

1. **📱 App Móvil** (React Native/Expo)
   - Videollamadas WebRTC
   - Softphone VoIP integrado
   - Dashboard y métricas

2. **📞 Softphone VoIP** (Twilio)
   - Llamadas a números reales
   - Widget para web
   - React Hook personalizable

3. **🏢 Centralita Virtual** (PBX)
   - IVR con menú de voz
   - Colas de llamadas
   - Grabación automática

---

## 🚀 **INICIO RÁPIDO:**

### **1. Lee el archivo START_HERE.md**
👉 **[START_HERE.md](START_HERE.md)**

Este archivo te guía en **3 pasos simples** para tener todo funcionando.

### **2. O sigue la guía detallada**
👉 **[QUICK_START.md](QUICK_START.md)**

Guía paso a paso con explicaciones detalladas (22 minutos).

---

## 📋 **CHECKLIST RÁPIDO:**

```bash
# 1. ¿Tienes cuenta de Twilio?
# NO → Créala en https://www.twilio.com/try-twilio
# SÍ → Continúa al paso 2

# 2. ¿Configuraste el .env?
cp .env.example .env
# Edita .env con tus credenciales

# 3. ¿Validaste la configuración?
npm run setup-twilio

# 4. ¿Iniciaste el sistema?
npm run start:all              # Linux/Mac
npm run start:all:windows      # Windows

# 5. ¿Probaste la app móvil?
cd apps/mobile && npm start
```

---

## 📂 **ARCHIVOS IMPORTANTES:**

| Archivo | ¿Para qué sirve? |
|---------|------------------|
| **[START_HERE.md](START_HERE.md)** | 👈 **EMPIEZA AQUÍ** - Punto de entrada principal |
| **[QUICK_START.md](QUICK_START.md)** | Guía de inicio rápido (3 pasos, 22 min) |
| **[SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)** | Guía completa con todos los detalles |
| `.env.example` | Plantilla de configuración |
| `scripts/setup-twilio.js` | Validador automático de configuración |
| `scripts/start-all.sh` | Iniciador de todos los servicios |

---

## 📱 **COMPONENTES:**

### **1. App Móvil**
```
apps/mobile/
├── app/              # Rutas (Expo Router)
├── package.json
└── README.md        # Docs de la app
```

**Características:**
- Dashboard con métricas
- Videollamadas WebRTC
- Softphone VoIP
- Notificaciones
- Dark mode

### **2. Librería Softphone**
```
packages/softphone/
├── src/
│   ├── TwilioSoftphone.ts      # Cliente principal
│   └── react/
│       ├── useSoftphone.tsx    # React Hook
│       └── SoftphoneWidget.tsx # Widget UI
└── README.md
```

**Uso:**
```tsx
import { SoftphoneWidget } from '@ait-core/softphone/react';

<SoftphoneWidget
  config={{ /* credenciales */ }}
  onTokenRequest={fetchToken}
/>
```

### **3. Servicio de Telefonía**
```
services/telephony/
├── src/
│   ├── main.ts              # API
│   ├── telephony.service.ts # Llamadas
│   ├── ivr.service.ts       # IVR
│   └── call-queue.service.ts # Colas
└── README.md
```

**Endpoints:**
- `POST /api/token` - Generar token
- `POST /api/calls/incoming` - Webhook entrantes
- `GET /api/calls/history` - Historial
- `GET /api/recordings/:sid` - Grabaciones

---

## 🔧 **CONFIGURACIÓN:**

### **Variables de entorno necesarias:**

```bash
# TWILIO (obligatorio)
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=your_token
TWILIO_API_KEY=SKxxxx...
TWILIO_API_SECRET=your_secret
TWILIO_PHONE_NUMBER=+34912345678
TWILIO_TWIML_APP_SID=APxxxx...

# DATABASE (opcional, usa defaults)
DB_HOST=localhost
DB_PORT=5432

# REDIS (opcional, usa defaults)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### **Dónde obtener las credenciales:**

1. **TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN**
   - Console → Account Info

2. **TWILIO_API_KEY & TWILIO_API_SECRET**
   - Console → API Keys → Create API Key

3. **TWILIO_PHONE_NUMBER**
   - Console → Phone Numbers → Buy a Number

4. **TWILIO_TWIML_APP_SID**
   - Console → Programmable Voice → TwiML Apps → Create

---

## 🎯 **CASOS DE USO:**

### **1. Agente llama a cliente**
```typescript
// Desde el softphone web
await softphone.makeCall({
  to: '+34612345678',
  record: true,
});
```

### **2. Cliente llama a la empresa**
1. Cliente marca tu número de Twilio
2. Escucha el IVR:
   ```
   "Bienvenido a AIT-CORE.
   Para seguros de vida, pulse 1..."
   ```
3. El sistema enruta según opción

### **3. Agente en móvil hace videollamada**
1. Abre app móvil
2. Va a tab "Videollamadas"
3. Selecciona contacto
4. Click "Llamar"

---

## 📊 **ARQUITECTURA:**

```
┌─────────────────┐
│  Twilio Cloud   │ ← Números telefónicos reales
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Backend  │
    │ Telephony│ ← IVR, Colas, Grabación
    └────┬─────┘
         │
    ┌────▼─────────────────┐
    │  Frontend Clients    │
    ├──────────────────────┤
    │ • Web (Softphone)    │
    │ • Mobile (App)       │
    │ • Admin Panel        │
    └──────────────────────┘
```

---

## 💰 **COSTOS (Twilio):**

### **Fijos:**
- Número telefónico: ~1€/mes

### **Variables:**
- Llamada entrante: ~0.0085€/min
- Llamada saliente: ~0.01€/min
- Grabación: ~0.0025€/min
- Transcripción: ~0.05€/min (opcional)

### **Ejemplo (100 llamadas/mes de 10 min):**
- Número: 1€
- Llamadas: 9€
- Grabación: 0.25€
- **Total: ~10€/mes**

---

## 🧪 **TESTING:**

### **Test 1: Configuración**
```bash
npm run setup-twilio
# Debe retornar: ✅ CONFIGURACIÓN COMPLETA
```

### **Test 2: Servicio de telefonía**
```bash
curl http://localhost:3020/health
# Debe retornar: {"status":"ok"}
```

### **Test 3: Token de Twilio**
```bash
curl -X POST http://localhost:3020/api/token \
  -H "Content-Type: application/json" \
  -d '{"identity":"test-user"}'
# Debe retornar un JWT
```

### **Test 4: Llamada de prueba**
1. Llama a tu número de Twilio
2. Escucha el IVR
3. Pulsa "1"
4. Debe transferir

---

## 🐛 **TROUBLESHOOTING:**

| Error | Solución |
|-------|----------|
| "No se encontró .env" | `cp .env.example .env` |
| "Invalid credentials" | Verificar valores en .env |
| "Port 3020 in use" | `lsof -i :3020` y matar proceso |
| "Device not initialized" | Esperar a que el servicio esté listo |
| "Microphone denied" | Dar permisos en browser/móvil |

Ver más en: [SOFTPHONE_AND_MOBILE_SETUP.md - Troubleshooting](SOFTPHONE_AND_MOBILE_SETUP.md#troubleshooting)

---

## 📚 **DOCUMENTACIÓN COMPLETA:**

1. **[START_HERE.md](START_HERE.md)** - Punto de entrada
2. **[QUICK_START.md](QUICK_START.md)** - Guía rápida (3 pasos)
3. **[SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)** - Guía completa
4. **[apps/mobile/README.md](apps/mobile/README.md)** - App móvil
5. **[packages/softphone/README.md](packages/softphone/README.md)** - Softphone
6. **[services/telephony/README.md](services/telephony/README.md)** - Telefonía

---

## ✅ **TODO ESTÁ LISTO:**

Solo necesitas:
1. ✅ **Código** → Ya está implementado
2. ⏳ **Cuenta Twilio** → 15 minutos
3. ⏳ **Configurar .env** → 5 minutos
4. ⏳ **Iniciar sistema** → 2 minutos

**Total: 22 minutos y está funcionando** 🚀

---

## 🎯 **SIGUIENTE PASO:**

**👉 Abre [START_HERE.md](START_HERE.md) y empieza**

---

**¿Preguntas?**
- 📧 support@ait-core.com
- 💬 [GitHub Issues](https://github.com/your-repo/issues)

---

**Creado**: 2026-01-28
**Versión**: 1.0.0
