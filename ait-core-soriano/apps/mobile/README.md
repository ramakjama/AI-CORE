# AIT-CORE Mobile App

App móvil React Native/Expo para el sistema ERP-OS AIT-CORE.

## 🚀 Características

### ✅ Implementado
- **📱 Navegación por tabs**: Dashboard, Videollamadas, Contactos, Configuración
- **🎥 WebRTC Video Calls**: Sistema de videollamadas peer-to-peer
- **📞 VoIP Integration**: Integración con Twilio para llamadas telefónicas
- **🔔 Notificaciones**: Sistema de notificaciones push
- **🌙 Dark Mode**: Soporte para tema oscuro
- **🔒 Seguridad**: Cifrado end-to-end en videollamadas

### 🎯 Funcionalidades principales

#### 1. Dashboard
- Resumen de actividad diaria
- Métricas de pólizas, siniestros y leads
- Acceso rápido a funciones principales

#### 2. Videollamadas WebRTC
- Llamadas de video/audio en tiempo real
- Control de micrófono y cámara
- Compartir pantalla (próximamente)
- Multi-participante
- Cifrado E2E

#### 3. Sistema VoIP
- Llamadas a números telefónicos reales (Twilio)
- Marcador telefónico
- Historial de llamadas
- Grabación de llamadas

## 📦 Instalación

### Prerrequisitos
```bash
node >= 20.0.0
npm >= 10.0.0
```

### Instalación de dependencias
```bash
cd apps/mobile
npm install
```

### Iniciar en desarrollo

#### Con Expo Go (más rápido)
```bash
npm start
```
Luego escanea el QR con:
- **iOS**: App "Cámara"
- **Android**: App "Expo Go"

#### Con emuladores

**Android:**
```bash
npm run android
```

**iOS (solo Mac):**
```bash
npm run ios
```

## 🏗️ Estructura del proyecto

```
apps/mobile/
├── app/                      # Rutas de navegación (Expo Router)
│   ├── (tabs)/              # Tabs principales
│   │   ├── dashboard.tsx    # Dashboard
│   │   ├── video-calls.tsx  # Lista de videollamadas
│   │   ├── contacts.tsx     # Contactos
│   │   └── settings.tsx     # Configuración
│   ├── video-call.tsx       # Pantalla de videollamada activa
│   ├── _layout.tsx          # Layout raíz
│   └── index.tsx            # Pantalla inicial
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Librerías y utilidades
│   ├── store/              # Estado global (Zustand)
│   └── types/              # TypeScript types
├── assets/                  # Imágenes, fuentes, etc.
├── app.json                # Configuración de Expo
├── package.json
└── tsconfig.json
```

## 🔧 Configuración

### Variables de entorno

Crear archivo `.env`:
```bash
# API Backend
API_URL=https://api.ait-core.com
WEBSOCKET_URL=wss://ws.ait-core.com

# Twilio (VoIP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret

# WebRTC Signaling
SIGNALING_URL=wss://signaling.ait-core.com

# STUN/TURN Servers
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-turn-server.com:3478
TURN_USERNAME=username
TURN_PASSWORD=password
```

## 📱 Funcionalidades detalladas

### WebRTC Videollamadas

**Iniciar llamada:**
1. Ir a tab "Videollamadas"
2. Seleccionar contacto disponible
3. Pulsar "📹 Llamar"

**Durante la llamada:**
- 🎤 Silenciar/Activar micrófono
- 📹 Activar/Desactivar cámara
- 🔄 Rotar cámara (frontal/trasera)
- 📺 Compartir pantalla
- 📞 Colgar llamada

**Características técnicas:**
- Protocolo: WebRTC (P2P)
- Codec video: VP8/VP9/H264
- Codec audio: Opus
- Cifrado: DTLS-SRTP (E2E)
- Latencia típica: < 200ms

### VoIP Telefónico (Twilio)

**Hacer llamada:**
1. Ir a marcador telefónico
2. Introducir número
3. Pulsar llamar

**Recibir llamada:**
- Notificación push automática
- Aceptar/Rechazar
- Historial de llamadas

**Características:**
- Llamadas a números reales (móviles/fijos)
- Calidad HD (Opus codec)
- Grabación de llamadas
- Transcripción automática (opcional)
- Integración con CRM

## 🧪 Testing

### Testing local
```bash
npm test
```

### Build de producción

**Android:**
```bash
eas build --platform android
```

**iOS:**
```bash
eas build --platform ios
```

## 📲 Publicación

### Google Play Store (Android)
```bash
eas submit --platform android
```

### Apple App Store (iOS)
```bash
eas submit --platform ios
```

## 🔐 Permisos requeridos

### Android
- `CAMERA`: Videollamadas
- `RECORD_AUDIO`: Audio en llamadas
- `MODIFY_AUDIO_SETTINGS`: Control de audio
- `INTERNET`: Conexión a backend
- `ACCESS_NETWORK_STATE`: Estado de red

### iOS
- `NSCameraUsageDescription`: Acceso a cámara
- `NSMicrophoneUsageDescription`: Acceso a micrófono

## 🐛 Troubleshooting

### Error: Metro bundler no inicia
```bash
npm start -- --reset-cache
```

### Error: No se conecta a backend
- Verificar que `API_URL` en `.env` es correcto
- Revisar que el backend esté corriendo
- Comprobar firewall/red

### Error: Cámara/micrófono no funciona
- Verificar permisos en Settings del dispositivo
- Reiniciar app
- En iOS: Permisos en Settings > Privacidad

### Error: WebRTC no conecta
- Verificar servidor de señalización
- Comprobar configuración STUN/TURN
- Revisar firewall que permita UDP

## 📚 Documentación adicional

- [Expo Documentation](https://docs.expo.dev/)
- [React Native WebRTC](https://github.com/react-native-webrtc/react-native-webrtc)
- [Twilio Voice SDK](https://www.twilio.com/docs/voice/sdks)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## 🤝 Soporte

Para issues o preguntas:
- GitHub Issues: [ait-core-soriano/issues](https://github.com/your-repo/issues)
- Email: support@ait-core.com

---

**Versión:** 1.0.0
**Última actualización:** 2026-01-28
**Mantenedor:** AIT-CORE Development Team
