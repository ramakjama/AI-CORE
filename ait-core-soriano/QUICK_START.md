# 🚀 QUICK START - AIT-CORE

**Guía de inicio rápido en 3 pasos**

---

## ⚡ **PASO 1: Obtener credenciales de Twilio (15 minutos)**

### **1.1 Crear cuenta**
👉 [twilio.com/try-twilio](https://www.twilio.com/try-twilio)

### **1.2 Comprar número telefónico**
1. Dashboard → Phone Numbers → Buy a Number
2. País: **España (+34)**
3. Filtrar: "Voice"
4. Comprar número (~1€/mes)

### **1.3 Crear TwiML App**
1. Console → Programmable Voice → TwiML Apps
2. Click "Create new TwiML App"
3. **Friendly Name**: `AIT-CORE Voice`
4. **Voice URL**: `https://TU-DOMINIO.com/api/calls/incoming` (cambiar después)
5. **Status Callback**: `https://TU-DOMINIO.com/api/webhooks/call-status`
6. Guardar y copiar el **Application SID** (empieza con `AP...`)

### **1.4 Crear API Key**
1. Console → Account → API Keys & Tokens
2. Click "Create API Key"
3. **Friendly Name**: `AIT-CORE`
4. Guardar en lugar seguro:
   - **API Key SID** (empieza con `SK...`)
   - **API Secret** (solo se muestra una vez)

### **1.5 Recopilar todas las credenciales**

Necesitarás estos 6 valores:

```
✅ TWILIO_ACCOUNT_SID      → De "Account Info" (AC...)
✅ TWILIO_AUTH_TOKEN        → De "Account Info"
✅ TWILIO_API_KEY           → De "API Keys" (SK...)
✅ TWILIO_API_SECRET        → De "API Keys"
✅ TWILIO_PHONE_NUMBER      → Tu número (+34...)
✅ TWILIO_TWIML_APP_SID     → De "TwiML Apps" (AP...)
```

---

## ⚙️ **PASO 2: Configurar el proyecto (5 minutos)**

### **2.1 Copiar archivos de configuración**

```bash
# En la raíz del proyecto
cp .env.example .env
cp services/telephony/.env.example services/telephony/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### **2.2 Editar .env con tus credenciales**

Abre `.env` y pega tus valores de Twilio:

```bash
# ===================================
# TWILIO (VoIP & Softphone)
# ===================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx    # 👈 TU VALOR AQUÍ
TWILIO_AUTH_TOKEN=your_auth_token            # 👈 TU VALOR AQUÍ
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxx        # 👈 TU VALOR AQUÍ
TWILIO_API_SECRET=your_api_secret            # 👈 TU VALOR AQUÍ
TWILIO_PHONE_NUMBER=+34912345678             # 👈 TU NÚMERO AQUÍ
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxx  # 👈 TU VALOR AQUÍ
```

### **2.3 Copiar mismas credenciales a otros archivos**

**Archivo**: `services/telephony/.env`
```bash
TWILIO_ACCOUNT_SID=...  # 👈 MISMO VALOR
TWILIO_AUTH_TOKEN=...   # 👈 MISMO VALOR
TWILIO_API_KEY=...      # 👈 MISMO VALOR
TWILIO_API_SECRET=...   # 👈 MISMO VALOR
TWILIO_PHONE_NUMBER=... # 👈 MISMO VALOR
TWILIO_TWIML_APP_SID=...# 👈 MISMO VALOR
```

**Archivo**: `apps/mobile/.env`
```bash
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=...  # 👈 SOLO Account SID
```

### **2.4 Validar configuración**

```bash
npm run setup-twilio
```

Deberías ver:
```
✅ CONFIGURACIÓN COMPLETA
🚀 Todo listo! Puedes iniciar el sistema con: npm run start:all
```

---

## 🚀 **PASO 3: Iniciar el sistema (2 minutos)**

### **3.1 Iniciar todos los servicios**

**En Windows:**
```bash
npm run start:all
```

**En Linux/Mac:**
```bash
chmod +x scripts/start-all.sh
npm run start:all
```

Verás:
```
✅ SISTEMA COMPLETAMENTE INICIADO

📱 App Web:         http://localhost:3000
📞 Telefonía:       http://localhost:3020
🔌 API Gateway:     http://localhost:3000/api
```

### **3.2 Probar la app móvil**

En otra terminal:

```bash
cd apps/mobile
npm install
npm start

# Escanear QR con:
# - iOS: App "Cámara"
# - Android: App "Expo Go"
```

---

## ✅ **¡LISTO! Ya puedes:**

### **📱 Usar la app móvil**
- Dashboard con métricas
- Videollamadas WebRTC
- Llamadas VoIP

### **🖥️ Usar el softphone en web**
- Abrir http://localhost:3000
- Botón flotante de teléfono
- Hacer/recibir llamadas

### **📞 Probar una llamada**
Desde el softphone, llama a tu número de Twilio.

Escucharás:
```
"Bienvenido a AIT-CORE Soriano Mediadores.
Para seguros de vida, pulse 1..."
```

---

## 🐛 **Si algo falla:**

### **Error: "Device not initialized"**
```bash
# Verificar que el servicio de telefonía está corriendo
curl http://localhost:3020/health
# Debería retornar: {"status":"ok"}
```

### **Error: "No se encontró .env"**
```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp services/telephony/.env.example services/telephony/.env
```

### **Error: "Invalid Twilio credentials"**
```bash
# Verificar valores en .env
cat .env | grep TWILIO

# Validar configuración
npm run setup-twilio
```

---

## 📚 **Documentación completa:**

Para más detalles:
- **Setup completo**: [SOFTPHONE_AND_MOBILE_SETUP.md](SOFTPHONE_AND_MOBILE_SETUP.md)
- **App móvil**: [apps/mobile/README.md](apps/mobile/README.md)
- **Softphone**: [packages/softphone/README.md](packages/softphone/README.md)
- **Telefonía**: [services/telephony/README.md](services/telephony/README.md)

---

## 💡 **Próximos pasos:**

Una vez funcionando localmente:

1. **Configurar webhooks públicos** (ngrok o deploy)
2. **Personalizar IVR** según tu negocio
3. **Integrar con CRM** para historial de llamadas
4. **Deploy a producción** (Vercel, Railway, AWS)

---

## 💰 **Costos estimados:**

- **Número Twilio**: ~1€/mes
- **100 llamadas/mes** (10 min/cada): ~8€/mes
- **Total**: **~10€/mes**

---

**¿Necesitas ayuda?**
- 📧 support@ait-core.com
- 💬 [GitHub Issues](https://github.com/your-repo/issues)

---

**Última actualización**: 2026-01-28
