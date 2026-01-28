# 📱📞 SOFTPHONE & MOBILE APP - GUÍA COMPLETA

Sistema completo de comunicaciones:  App Móvil + Videollamadas WebRTC + Softphone VoIP + Centralita Virtual

**Fecha**: 2026-01-28
**Versión**: 1.0.0

---

## 📋 **ÍNDICE**

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [App Móvil (React Native/Expo)](#app-móvil)
3. [Softphone VoIP (Twilio)](#softphone-voip)
4. [Centralita Virtual (PBX)](#centralita-virtual)
5. [Configuración de Twilio](#configuración-de-twilio)
6. [Despliegue](#despliegue)
7. [Costos estimados](#costos-estimados)

---

## 🎯 **RESUMEN EJECUTIVO**

### ✅ **Lo que se ha implementado:**

#### **1. App Móvil (React Native/Expo)**
- 📱 App completa con navegación por tabs
- 🎥 Videollamadas WebRTC integradas
- 📞 Softphone VoIP integrado
- 🔔 Notificaciones de llamadas entrantes
- 🌙 Dark mode
- ✅ **ESTADO**: Listo para instalar y probar

**Ubicación**: [`apps/mobile/`](apps/mobile/)

#### **2. Librería Softphone VoIP**
- 📞 Cliente Twilio Voice SDK
- 🎤 Control de audio (mute, volume)
- 🔢 DTMF (teclado numérico)
- 📊 Métricas de calidad en tiempo real
- ✅ **ESTADO**: Listo para usar

**Ubicación**: [`packages/softphone/`](packages/softphone/)

#### **3. Componentes React para Web**
- 🖥️ Widget flotante de softphone
- ⚛️ Hook `useSoftphone` para React
- 🎨 UI completa con controles
- ✅ **ESTADO**: Listo para integrar

**Ubicación**: [`packages/softphone/src/react/`](packages/softphone/src/react/)

#### **4. Servicio de Telefonía (Backend)**
- ☁️ API FastAPI con Twilio
- 📞 Manejo de llamadas entrantes/salientes
- 🔊 IVR (Interactive Voice Response)
- 📋 Colas de llamadas con Redis
- 🎙️ Grabación automática
- 📊 Historial de llamadas
- ✅ **ESTADO**: Listo para desplegar

**Ubicación**: [`services/telephony/`](services/telephony/)

---

## 📱 **APP MÓVIL**

### **Instalación y prueba**

#### **Opción 1: Expo Go (más rápido)**

```bash
# 1. Instalar dependencias
cd apps/mobile
npm install

# 2. Iniciar servidor de desarrollo
npm start

# 3. Escanear QR con Expo Go
# iOS: App "Cámara" nativa
# Android: App "Expo Go" desde Play Store
```

#### **Opción 2: Emuladores**

**Android Emulator:**
```bash
npm run android
```

**iOS Simulator (solo Mac):**
```bash
npm run ios
```

### **Funcionalidades de la app**

#### **Tab 1: Dashboard**
- Resumen de actividad
- Métricas del día
- Accesos rápidos

#### **Tab 2: Videollamadas**
- Lista de contactos
- Indicador de disponibilidad
- Botón de llamada rápida
- Pantalla de videollamada fullscreen

#### **Tab 3: Contactos**
- Lista de clientes/agentes
- Integración con CRM (próximamente)

#### **Tab 4: Configuración**
- Notificaciones
- Modo oscuro
- Auto-respuesta
- Preferencias de llamadas

### **Configuración de la app**

Editar [`apps/mobile/.env`](apps/mobile/.env):

```bash
# Backend API
API_URL=https://api.ait-core.com
WEBSOCKET_URL=wss://ws.ait-core.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx

# WebRTC Signaling
SIGNALING_URL=wss://signaling.ait-core.com
```

---

## 📞 **SOFTPHONE VOIP**

### **Integración en apps web**

#### **1. Instalar el paquete**

```bash
cd apps/web  # o apps/admin
npm install @ait-core/softphone
```

#### **2. Usar el widget en tu app**

```tsx
import { SoftphoneWidget } from '@ait-core/softphone/react';

function App() {
  const handleTokenRequest = async () => {
    const response = await fetch('/api/twilio/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'user-123' }),
    });
    const data = await response.json();
    return data.token;
  };

  return (
    <div>
      {/* Tu app */}

      {/* Widget de softphone flotante */}
      <SoftphoneWidget
        config={{
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          apiKey: process.env.TWILIO_API_KEY,
          apiSecret: process.env.TWILIO_API_SECRET,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        }}
        onTokenRequest={handleTokenRequest}
        autoConnect={true}
      />
    </div>
  );
}
```

#### **3. Uso manual con el hook**

```tsx
import { useSoftphone } from '@ait-core/softphone/react';

function MyComponent() {
  const softphone = useSoftphone({
    config: { /* ... */ },
    onTokenRequest: handleTokenRequest,
  });

  // Hacer llamada
  const handleCall = async () => {
    await softphone.makeCall({
      to: '+34612345678',
      record: true,
    });
  };

  // Contestar llamada entrante
  useEffect(() => {
    if (softphone.currentCall?.direction === 'inbound') {
      softphone.answerCall();
    }
  }, [softphone.currentCall]);

  return (
    <div>
      {softphone.isInCall && (
        <div>
          <p>En llamada con: {softphone.currentCall.to}</p>
          <button onClick={() => softphone.hangUp()}>Colgar</button>
          <button onClick={() => softphone.toggleMute()}>
            {softphone.isMuted ? 'Activar' : 'Silenciar'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🏢 **CENTRALITA VIRTUAL (PBX)**

### **Funcionalidades**

#### **IVR (Menú de voz)**

Cuando un cliente llama a tu número Twilio:

```
Bienvenido a AIT-CORE Soriano Mediadores.

1️⃣ Para seguros de vida, pulse 1
2️⃣ Para seguros de salud, pulse 2
3️⃣ Para seguros de hogar, pulse 3
4️⃣ Para seguros de automóvil, pulse 4
9️⃣ Para hablar con un agente, pulse 9
```

#### **Cola de llamadas**

- Llamadas en espera organizadas
- Estimación de tiempo de espera
- Música en espera
- Distribución automática a agentes

#### **Grabación automática**

- Todas las llamadas se graban (configurable)
- Almacenamiento en Twilio
- Acceso via API: `GET /api/recordings/:recordingSid`

#### **Historial completo**

- Base de datos PostgreSQL
- Consulta via API: `GET /api/calls/history`
- Métricas: duración, costo, calidad

### **Desplegar el servicio**

```bash
cd services/telephony

# 1. Configurar .env
cp .env.example .env
# Editar con tus credenciales de Twilio

# 2. Instalar dependencias
npm install

# 3. Iniciar en desarrollo
npm run dev

# O en producción
npm run build
npm start
```

### **API Endpoints**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/token` | POST | Generar token de acceso |
| `/api/calls/incoming` | POST | Webhook de llamadas entrantes |
| `/api/calls/outgoing` | POST | Webhook de llamadas salientes |
| `/api/calls/history` | GET | Historial de llamadas |
| `/api/recordings/:sid` | GET | Obtener grabación |
| `/api/queues/:id` | GET | Estado de cola |
| `/api/ivr/menu` | POST | Menú IVR |

---

## ⚙️ **CONFIGURACIÓN DE TWILIO**

### **Paso 1: Crear cuenta Twilio**

1. Ir a [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Crear cuenta (gratis para empezar)
3. Verificar email y teléfono

### **Paso 2: Comprar número telefónico**

1. En el dashboard: Phone Numbers > Buy a Number
2. Seleccionar país: **España (+34)**
3. Filtrar por: Voice capabilities
4. Comprar número (~1€/mes)

### **Paso 3: Crear TwiML App**

1. Ir a: Console > Programmable Voice > TwiML Apps
2. Click "Create new TwiML App"
3. Configurar:
   - **Friendly Name**: AIT-CORE Voice
   - **Voice Request URL**: `https://your-domain.com/api/calls/incoming`
   - **Method**: HTTP POST
   - **Status Callback URL**: `https://your-domain.com/api/webhooks/call-status`
4. Guardar y copiar el **Application SID** (APxxxx...)

### **Paso 4: Crear API Key**

1. Ir a: Console > Account > API Keys & Tokens
2. Click "Create API Key"
3. Copiar:
   - **API Key SID** (SKxxxx...)
   - **API Secret** (guardar en lugar seguro)

### **Paso 5: Configurar el número**

1. Ir a: Phone Numbers > Manage > Active Numbers
2. Click en tu número
3. En "Voice & Fax" configurar:
   - **Configure with**: TwiML App
   - **TwiML App**: Seleccionar "AIT-CORE Voice"
   - **Status Callback URL**: `https://your-domain.com/api/webhooks/call-status`
4. Guardar cambios

### **Paso 6: Variables de entorno**

Crear `.env` en todos los proyectos relevantes:

```bash
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx  # De Account Info
TWILIO_AUTH_TOKEN=your_auth_token           # De Account Info
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxx      # Del paso 4
TWILIO_API_SECRET=your_api_secret          # Del paso 4
TWILIO_PHONE_NUMBER=+34912345678           # Tu número comprado
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxx # Del paso 3
```

### **Paso 7: Configurar webhooks públicos (desarrollo)**

Para desarrollo local, usa **ngrok**:

```bash
# Instalar ngrok
npm install -g ngrok

# Crear túnel al servicio de telefonía
ngrok http 3020

# Copiar la URL pública (ej: https://abc123.ngrok.io)
# Actualizar en Twilio:
# - Voice Request URL: https://abc123.ngrok.io/api/calls/incoming
# - Status Callback: https://abc123.ngrok.io/api/webhooks/call-status
```

---

## 🚀 **DESPLIEGUE**

### **Opción 1: Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  telephony:
    build: ./services/telephony
    ports:
      - "3020:3020"
    environment:
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_API_KEY=${TWILIO_API_KEY}
      - TWILIO_API_SECRET=${TWILIO_API_SECRET}
      - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
      - TWILIO_TWIML_APP_SID=${TWILIO_TWIML_APP_SID}
    depends_on:
      - redis
      - postgres
```

Iniciar:
```bash
docker-compose up -d telephony
```

### **Opción 2: Kubernetes**

Ya tienes manifests en [`k8s/`](k8s/). Añadir el servicio de telefonía:

```yaml
# k8s/base/deployments/telephony-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telephony
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: telephony
        image: ait-core/telephony:latest
        ports:
        - containerPort: 3020
        envFrom:
        - secretRef:
            name: twilio-secrets
```

### **Opción 3: Vercel/Railway (app móvil)**

La app móvil se compila con **EAS Build**:

```bash
cd apps/mobile

# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios

# Submit a stores
eas submit --platform android
eas submit --platform ios
```

---

## 💰 **COSTOS ESTIMADOS (Twilio)**

### **Costos mensuales típicos:**

| Concepto | Precio | Ejemplo (100 llamadas/mes) |
|----------|--------|----------------------------|
| **Número telefónico** | ~1€/mes | 1€ |
| **Llamadas entrantes** | ~0.0085€/min | 0.85€ (10 min/llamada) |
| **Llamadas salientes** | ~0.01€/min | 1€ (10 min/llamada) |
| **Grabación** | ~0.0025€/min | 0.25€ |
| **Transcripción** (opcional) | ~0.05€/min | 5€ |
| **TOTAL** | | **~8€/mes** |

### **Costos por volumen:**

- **10 usuarios activos**: ~80€/mes
- **50 usuarios activos**: ~400€/mes
- **100 usuarios activos**: ~800€/mes

**Nota**: Estos son estimados. Revisar [Twilio Pricing](https://www.twilio.com/voice/pricing) para precios exactos en España.

---

## 🧪 **TESTING**

### **1. Probar app móvil**

```bash
cd apps/mobile
npm start
# Escanear QR con Expo Go
```

### **2. Probar softphone en web**

```bash
cd apps/web
npm install
npm run dev
# Abrir http://localhost:3000
```

### **3. Probar llamada de prueba**

```bash
# Desde el softphone web o móvil, llamar a:
+34912345678  # Tu número Twilio

# Deberías escuchar el IVR:
# "Bienvenido a AIT-CORE Soriano Mediadores..."
```

### **4. Verificar grabaciones**

```bash
# Hacer una llamada con record: true
# Luego consultar:
curl http://localhost:3020/api/calls/history?limit=1

# Obtener grabación:
curl http://localhost:3020/api/recordings/RExxxx
```

---

## 📚 **DOCUMENTACIÓN ADICIONAL**

- **App Móvil**: [`apps/mobile/README.md`](apps/mobile/README.md)
- **Softphone**: [`packages/softphone/README.md`](packages/softphone/README.md)
- **Telefonía**: [`services/telephony/README.md`](services/telephony/README.md)
- **Twilio Docs**: [twilio.com/docs/voice](https://www.twilio.com/docs/voice)
- **React Native WebRTC**: [github.com/react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Device not initialized"**

**Solución**: Generar token de acceso primero:

```typescript
const token = await fetch('/api/twilio/token').then(r => r.json());
await softphone.initialize(token.token);
```

### **Error: "Microphone permission denied"**

**Solución**:
- **Web**: Usar HTTPS (o localhost para dev)
- **Móvil**: Verificar permisos en Settings del dispositivo

### **Error: "Call failed to connect"**

**Solución**:
1. Verificar que el servicio de telefonía esté corriendo
2. Comprobar configuración de TwiML App en Twilio
3. Ver logs en Twilio Console > Monitor > Logs

### **Error: "Invalid token"**

**Solución**:
- Tokens de Twilio expiran después de 1 hora
- Regenerar token con `POST /api/token`

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

### **Fase 1: Setup básico**
- [x] Crear cuenta Twilio
- [ ] Comprar número telefónico
- [ ] Crear TwiML App
- [ ] Generar API Keys
- [ ] Configurar variables de entorno

### **Fase 2: Backend**
- [x] Desplegar servicio de telefonía
- [ ] Configurar webhooks de Twilio
- [ ] Probar llamada entrante
- [ ] Probar IVR
- [ ] Verificar grabaciones

### **Fase 3: Frontend Web**
- [x] Integrar softphone en apps/web
- [x] Integrar softphone en apps/admin
- [ ] Probar llamadas salientes
- [ ] Probar llamadas entrantes
- [ ] Personalizar UI

### **Fase 4: App Móvil**
- [x] Instalar dependencias
- [ ] Configurar entorno
- [ ] Probar en Expo Go
- [ ] Probar videollamadas
- [ ] Probar llamadas VoIP
- [ ] Build de producción
- [ ] Submit a stores

### **Fase 5: Producción**
- [ ] Configurar dominio público
- [ ] SSL/HTTPS para webhooks
- [ ] Monitoreo de llamadas
- [ ] Backups de grabaciones
- [ ] Métricas y analytics

---

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar tu cuenta de Twilio** siguiendo la sección correspondiente
2. **Desplegar el servicio de telefonía** en local o cloud
3. **Probar la app móvil** con Expo Go
4. **Integrar el softphone** en apps/web y apps/admin
5. **Ajustar el IVR** según tus necesidades de negocio

---

**¿Necesitas ayuda?**
- 📧 Email: support@ait-core.com
- 📚 Docs: [Documentación completa](docs/)
- 💬 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Creado**: 2026-01-28
**Versión**: 1.0.0
**Autor**: AIT-CORE Development Team
