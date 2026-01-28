# 📱📞 AIT-COMMS

**Sistema de Comunicaciones Empresariales para AIT-CORE**

---

## ✅ **¡LISTO PARA USAR!**

Solo necesitas **meter tus credenciales de Twilio** y todo funciona automáticamente.

---

## 📦 **¿QUÉ ES AIT-COMMS?**

**AIT-COMMS** es el módulo de comunicaciones completo que incluye:

- 📱 **App móvil** → React Native/Expo (iOS + Android)
- 📞 **Softphone VoIP** → Llamadas a números reales
- 🏢 **Centralita PBX** → IVR, colas, grabación automática
- 🎥 **Videollamadas WebRTC** → P2P cifradas end-to-end

---

## 🚀 **INICIO EN 3 PASOS (22 minutos):**

### **Paso 1: Twilio (15 min)**
```bash
# 1. Crear cuenta: https://www.twilio.com/try-twilio
# 2. Comprar número español: +34...
# 3. Crear TwiML App
# 4. Generar API Key
# 5. Copiar 6 credenciales
```

### **Paso 2: Configurar (5 min)**
```bash
# Copiar archivos .env
cp .env.example .env
cp services/telephony/.env.example services/telephony/.env
cp apps/mobile/.env.example apps/mobile/.env

# Editar .env y pegar tus 6 credenciales de Twilio
```

### **Paso 3: Arrancar (2 min)**
```bash
# Validar configuración
npm run setup-twilio

# Iniciar TODO el sistema
npm run start:all              # Linux/Mac
npm run start:all:windows      # Windows
```

**¡HECHO!** El sistema arranca en http://localhost:3020

---

## 📦 **COMPONENTES:**

### **1. @ait-core/ait-comms-mobile**
App móvil con videollamadas + softphone VoIP

```bash
cd apps/mobile
npm start
# Escanear QR con Expo Go
```

### **2. @ait-core/ait-comms-softphone**
Librería de softphone para web/React

```tsx
import { SoftphoneWidget } from '@ait-core/ait-comms-softphone/react';

<SoftphoneWidget config={twilioConfig} onTokenRequest={fetchToken} />
```

### **3. @ait-core/ait-comms-telephony**
Servicio backend de telefonía (API + IVR + Colas)

```bash
cd services/telephony
npm run dev
# Servidor en http://localhost:3020
```

---

## 🔑 **CONFIGURACIÓN (.env):**

Solo necesitas pegar estos 6 valores de Twilio:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx       # Console → Account Info
TWILIO_AUTH_TOKEN=your_token          # Console → Account Info
TWILIO_API_KEY=SKxxxxxxxxxx           # Console → API Keys
TWILIO_API_SECRET=your_secret         # Console → API Keys
TWILIO_PHONE_NUMBER=+34912345678      # Console → Phone Numbers
TWILIO_TWIML_APP_SID=APxxxxxxxxxx     # Console → TwiML Apps
```

---

## 📋 **COMANDOS NPM:**

```bash
# Validar configuración de Twilio
npm run setup-twilio

# Iniciar todo el sistema
npm run start:all              # Linux/Mac
npm run start:all:windows      # Windows

# Iniciar solo telefonía
npm run start:telephony

# Iniciar solo app móvil
npm run start:mobile
```

---

## 🎯 **CASOS DE USO:**

### **Cliente llama a tu empresa:**
```
Cliente marca +34912345678 (tu número Twilio)
    ↓
Escucha IVR en español:
    "Bienvenido a AIT-CORE Soriano Mediadores.
     Para seguros de vida, pulse 1..."
    ↓
Presiona "1"
    ↓
Transferido al departamento de vida
```

### **Agente llama desde web:**
```
Abre softphone web → Marca +34612345678
    ↓
Llamada vía Twilio (grabada automáticamente)
    ↓
Historial guardado en base de datos
```

### **Videollamada entre agentes:**
```
Agente 1 (app móvil) → Llama a Agente 2
    ↓
WebRTC P2P con cifrado E2E
    ↓
Video HD + Audio + Screen sharing
```

---

## 💰 **COSTOS (Twilio):**

| Concepto | Precio | Ejemplo (100 llamadas/mes) |
|----------|--------|----------------------------|
| Número | ~1€/mes | 1€ |
| Llamadas | ~0.01€/min | 9€ (10 min/llamada) |
| Grabación | ~0.0025€/min | 0.25€ |
| **TOTAL** | | **~10€/mes** |

---

## 📚 **DOCUMENTACIÓN:**

| Archivo | Para qué |
|---------|----------|
| **[START_HERE.md](START_HERE.md)** | 👈 **EMPIEZA AQUÍ** |
| **[QUICK_START.md](QUICK_START.md)** | Guía 3 pasos (22 min) |
| **[SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)** | Guía completa |
| **[AIT_COMMS_SUMMARY.md](AIT_COMMS_SUMMARY.md)** | Resumen técnico |

---

## 🏗️ **ARQUITECTURA:**

```
┌────────────────┐
│  Twilio Cloud  │ ← Red telefónica real
└───────┬────────┘
        │
   ┌────▼─────────────────┐
   │ ait-comms-telephony  │ ← Backend (IVR + Colas + Grabación)
   └────┬─────────────────┘
        │
   ┌────▼────────────────────┐
   │  Frontend Clients       │
   │  • ait-comms-mobile     │
   │  • ait-comms-softphone  │
   └─────────────────────────┘
```

---

## ✅ **FUNCIONALIDADES:**

### **Softphone VoIP:**
- ✅ Llamadas a cualquier número
- ✅ Recepción de llamadas
- ✅ Mute/unmute
- ✅ Teclado DTMF (0-9, *, #)
- ✅ Métricas de calidad (MOS, latency, jitter)
- ✅ Widget flotante para web

### **Centralita PBX:**
- ✅ IVR multinivel en español
- ✅ Colas de llamadas con Redis
- ✅ Distribución a agentes
- ✅ Música en espera
- ✅ Grabación automática
- ✅ Historial completo (PostgreSQL)

### **App Móvil:**
- ✅ Videollamadas WebRTC
- ✅ Softphone integrado
- ✅ Dashboard con métricas
- ✅ Dark mode
- ✅ iOS + Android

### **Videollamadas:**
- ✅ P2P (baja latencia)
- ✅ Audio + Video HD
- ✅ Screen sharing
- ✅ Multi-participante
- ✅ Cifrado E2E

---

## 🧪 **TESTING:**

```bash
# 1. Validar config
npm run setup-twilio

# 2. Test servicio
curl http://localhost:3020/health

# 3. Test token
curl -X POST http://localhost:3020/api/token \
  -d '{"identity":"test"}'

# 4. Test llamada
# Llama a tu número desde el softphone
```

---

## 🐛 **TROUBLESHOOTING:**

| Error | Solución |
|-------|----------|
| No .env | `cp .env.example .env` |
| Invalid credentials | Verificar en Twilio Console |
| Port in use | `lsof -i :3020` y matar |

---

## 📝 **PRÓXIMO PASO:**

**👉 Abre [START_HERE.md](START_HERE.md) y empieza**

---

**Versión**: 1.0.0
**Fecha**: 2026-01-28
**Autor**: AIT-CORE Development Team

---

© 2026 AIN TECH - Soriano Mediadores
