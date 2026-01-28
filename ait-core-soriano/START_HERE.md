# 🚀 START HERE - Sistema de Comunicaciones Completo

**App Móvil + Softphone VoIP + Centralita Virtual - Todo listo para usar**

---

## ✅ **LO QUE TIENES:**

### **📱 App Móvil (React Native/Expo)**
- Dashboard con métricas
- Videollamadas WebRTC P2P
- Softphone VoIP integrado
- Lista de contactos
- Configuración personalizable

### **📞 Softphone VoIP (Twilio)**
- Llamadas a números reales
- Widget flotante para web
- Control de audio (mute, volumen)
- Teclado DTMF (0-9, *, #)
- Métricas de calidad en tiempo real

### **🏢 Centralita Virtual (PBX)**
- IVR con menú de voz en español
- Colas de llamadas
- Grabación automática
- Historial completo
- Distribución a agentes

---

## 🎯 **3 PASOS PARA EMPEZAR:**

### **Paso 1: Obtener credenciales de Twilio**
👉 [Ver guía completa](QUICK_START.md#paso-1-obtener-credenciales-de-twilio-15-minutos)

**Resumen rápido:**
1. Crear cuenta en [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Comprar número español (+34)
3. Crear TwiML App
4. Generar API Key
5. Recopilar 6 valores

### **Paso 2: Configurar el proyecto**
```bash
# 1. Copiar archivos de configuración
cp .env.example .env
cp services/telephony/.env.example services/telephony/.env
cp apps/mobile/.env.example apps/mobile/.env

# 2. Editar .env con tus credenciales de Twilio
# (Ver sección siguiente)

# 3. Validar configuración
npm run setup-twilio
```

### **Paso 3: Iniciar el sistema**
```bash
# Windows
npm run start:all:windows

# Linux/Mac
npm run start:all
```

---

## 🔑 **CONFIGURACIÓN RÁPIDA:**

Edita el archivo `.env` con tus credenciales de Twilio:

```bash
# Obtén estos 6 valores de https://console.twilio.com

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx      # Account Info → Account SID
TWILIO_AUTH_TOKEN=your_token               # Account Info → Auth Token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxx          # API Keys → SID
TWILIO_API_SECRET=your_secret              # API Keys → Secret
TWILIO_PHONE_NUMBER=+34912345678           # Phone Numbers → Tu número
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxx    # TwiML Apps → Application SID
```

Copia los mismos valores en:
- `services/telephony/.env`
- `apps/mobile/.env` (solo Account SID)

---

## 📱 **PROBAR LA APP MÓVIL:**

```bash
cd apps/mobile
npm install
npm start

# Escanear QR con:
# - iOS: App "Cámara"
# - Android: App "Expo Go"
```

---

## 🖥️ **PROBAR EL SOFTPHONE EN WEB:**

```bash
# El softphone se inicia automáticamente con start:all
# Abre: http://localhost:3000

# Verás un botón flotante de teléfono en la esquina
```

---

## 📞 **PROBAR UNA LLAMADA:**

### **Opción 1: Llamada saliente**
1. Click en el botón de teléfono
2. Introducir número (ej: +34612345678)
3. Click "Llamar"

### **Opción 2: Llamada entrante**
1. Llama a tu número de Twilio desde tu móvil
2. Escucharás el IVR:
   ```
   "Bienvenido a AIT-CORE Soriano Mediadores.
   Para seguros de vida, pulse 1..."
   ```

---

## 📂 **ESTRUCTURA DEL CÓDIGO:**

```
ait-core-soriano/
├── apps/
│   └── mobile/              # 📱 App móvil (React Native/Expo)
│       ├── app/            # Rutas y pantallas
│       ├── package.json
│       └── README.md
│
├── packages/
│   └── softphone/          # 📞 Librería de softphone
│       ├── src/
│       │   ├── TwilioSoftphone.ts    # Cliente principal
│       │   └── react/                # Componentes React
│       │       ├── useSoftphone.tsx  # Hook
│       │       └── SoftphoneWidget.tsx
│       └── README.md
│
├── services/
│   └── telephony/          # 🏢 Servicio de telefonía (Backend)
│       ├── src/
│       │   ├── main.ts               # API principal
│       │   ├── telephony.service.ts  # Lógica de llamadas
│       │   ├── ivr.service.ts        # IVR
│       │   └── call-queue.service.ts # Colas
│       └── README.md
│
├── scripts/
│   ├── setup-twilio.js     # ✅ Validador de configuración
│   ├── start-all.sh        # 🚀 Iniciar todo (Linux/Mac)
│   └── start-all.bat       # 🚀 Iniciar todo (Windows)
│
├── .env.example            # Plantilla de configuración
├── QUICK_START.md          # Guía de inicio rápido
├── SOFTPHONE_AND_MOBILE_SETUP.md  # Guía completa
└── START_HERE.md           # Este archivo
```

---

## 📚 **DOCUMENTACIÓN:**

| Documento | Descripción |
|-----------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | Guía paso a paso (3 pasos, 22 minutos) |
| **[SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)** | Guía completa y detallada |
| **[apps/mobile/README.md](apps/mobile/README.md)** | Documentación de la app móvil |
| **[packages/softphone/README.md](packages/softphone/README.md)** | Documentación del softphone |
| **[services/telephony/README.md](services/telephony/README.md)** | Documentación de la centralita |

---

## 🛠️ **COMANDOS ÚTILES:**

```bash
# Validar configuración de Twilio
npm run setup-twilio

# Iniciar todo el sistema
npm run start:all              # Linux/Mac
npm run start:all:windows      # Windows

# Iniciar solo el servicio de telefonía
npm run start:telephony

# Iniciar solo la app móvil
npm run start:mobile

# Ver servicios Docker corriendo
docker ps

# Ver logs del servicio de telefonía
cd services/telephony && npm run dev
```

---

## 💰 **COSTOS (Twilio):**

| Concepto | Precio |
|----------|--------|
| Número telefónico | ~1€/mes |
| Llamadas (10 min) | ~0.10€ |
| Grabación (10 min) | ~0.03€ |
| **Estimado para 100 llamadas/mes** | **~10€/mes** |

---

## 🐛 **SOLUCIÓN DE PROBLEMAS:**

### **Error: "No se encontró .env"**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### **Error: "Invalid Twilio credentials"**
```bash
# Validar configuración
npm run setup-twilio

# Verificar valores
cat .env | grep TWILIO
```

### **Error: "Port already in use"**
```bash
# Ver qué está usando el puerto
lsof -i :3020  # Linux/Mac
netstat -ano | findstr :3020  # Windows

# Matar el proceso
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

---

## ✅ **CHECKLIST:**

- [ ] Cuenta de Twilio creada
- [ ] Número telefónico comprado
- [ ] TwiML App configurada
- [ ] API Key generada
- [ ] Archivo `.env` configurado
- [ ] Configuración validada (`npm run setup-twilio`)
- [ ] Sistema iniciado (`npm run start:all`)
- [ ] App móvil probada
- [ ] Llamada de prueba realizada

---

## 🎯 **SIGUIENTE PASO:**

**👉 Abre [QUICK_START.md](QUICK_START.md) y sigue los 3 pasos**

**Tiempo estimado:** 22 minutos
- Paso 1 (Twilio): 15 min
- Paso 2 (Config): 5 min
- Paso 3 (Inicio): 2 min

---

## 💬 **¿NECESITAS AYUDA?**

- 📧 Email: support@ait-core.com
- 💬 GitHub: [Issues](https://github.com/your-repo/issues)
- 📚 Docs: [Documentación completa](docs/)

---

**¡Empecemos!** 🚀

👉 [QUICK_START.md](QUICK_START.md)
