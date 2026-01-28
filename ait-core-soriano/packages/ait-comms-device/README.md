# 📱 @ait-core/ait-comms-device

**AINTECH Device - High-Tech Softphone with AIT-OS**

Sistema de softphone corporativo con estética FUI (Fantasy User Interface) diseñado específicamente para AINTECH.

---

## 🎨 **Características**

### **Hardware Design**
- ✅ Dispositivo corporativo custom (no-iPhone aesthetic)
- ✅ Marco metálico con acabado mate negro + acentos cyan
- ✅ LED ring dinámico (estado de llamada)
- ✅ Botones físicos interactivos
- ✅ Altavoces con grille pattern
- ✅ Logo AINTECH grabado

### **AIT-OS**
- ✅ Sistema operativo propietario
- ✅ Status bar con métricas en tiempo real
- ✅ Fondo hexagonal animado
- ✅ Efectos holográficos y scanlines
- ✅ Gesture bar iOS-style
- ✅ Smooth animations

### **Softphone FUI**
- ✅ Interfaz high-tech con paneles holográficos
- ✅ Estados visuales: idle, incoming, active
- ✅ Visualizador de forma de onda en tiempo real
- ✅ Indicadores de calidad (MOS, jitter, latency)
- ✅ Controles táctiles con feedback visual
- ✅ Efectos de glow y blur

---

## 🚀 **Instalación**

```bash
cd packages/ait-comms-device
npm install
```

---

## 📦 **Uso**

### **Básico**

```tsx
import { AITECHDevice } from '@ait-core/ait-comms-device';

function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000'
    }}>
      <AITECHDevice />
    </div>
  );
}
```

### **Con configuración**

```tsx
import { AITOSShell, SoftphoneApp } from '@ait-core/ait-comms-device';

function CustomDevice() {
  const handleCallStateChange = (state) => {
    console.log('Call state:', state);
  };

  return (
    <div className="custom-device">
      <AITOSShell onCallStateChange={handleCallStateChange}>
        <SoftphoneApp />
      </AITOSShell>
    </div>
  );
}
```

### **Componentes individuales**

```tsx
import {
  HexGrid,
  HolographicPanel,
  WaveformVisualizer
} from '@ait-core/ait-comms-device';

function MyComponent() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Fondo animado */}
      <HexGrid animate={true} />

      {/* Panel holográfico */}
      <HolographicPanel title="STATUS" variant="primary">
        <p>Content here...</p>
      </HolographicPanel>

      {/* Visualizador de audio */}
      <WaveformVisualizer isActive={true} bars={40} />
    </div>
  );
}
```

---

## 🎨 **Componentes**

### **AITECHDevice**
Contenedor principal del dispositivo.

**Props:**
- Sin props (self-contained)

---

### **AITOSShell**
Sistema operativo AIT-OS.

**Props:**
```typescript
interface AITOSShellProps {
  onCallStateChange: (state: 'idle' | 'ringing' | 'active') => void;
}
```

---

### **SoftphoneApp**
Aplicación de softphone.

**Props:**
```typescript
interface SoftphoneAppProps {
  onCallStateChange: (state: 'idle' | 'ringing' | 'active') => void;
}
```

---

### **HexGrid**
Fondo hexagonal animado.

**Props:**
```typescript
interface HexGridProps {
  animate?: boolean;      // Default: true
  color?: string;         // Default: '#00D9FF'
  opacity?: number;       // Default: 0.1
}
```

---

### **HolographicPanel**
Panel con efectos holográficos.

**Props:**
```typescript
interface HolographicPanelProps {
  children: ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'alert';  // Default: 'primary'
  glowIntensity?: number;                       // Default: 1
  animate?: boolean;                            // Default: true
  className?: string;
}
```

**Variants:**
- `primary`: Cyan (#00D9FF)
- `secondary`: Lime (#B4FF39)
- `alert`: Red (#FF3366)

---

### **WaveformVisualizer**
Visualizador de forma de onda.

**Props:**
```typescript
interface WaveformVisualizerProps {
  isActive: boolean;
  color?: string;    // Default: '#00D9FF'
  bars?: number;     // Default: 40
  height?: number;   // Default: 60
}
```

---

## 🎨 **Design Tokens**

### **Colors**

```css
/* Base */
--color-bg-primary: #0A0E17;
--color-bg-secondary: #141824;
--color-bg-tertiary: #1E2433;

/* Accent - AINTECH */
--color-accent-primary: #00D9FF;    /* Cyan electric */
--color-secondary: #B4FF39;          /* Neon lime */

/* Status */
--color-success: #00FF88;
--color-warning: #FFB800;
--color-error: #FF3366;

/* Call States */
--color-incoming: #FF3366;
--color-outgoing: #00D9FF;
--color-connected: #00FF88;

/* Agent States */
--color-available: #00FF88;
--color-busy: #FF3366;
--color-wrapup: #FFB800;
```

### **Typography**

```css
--font-display: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### **Spacing**

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

---

## 🎬 **Animaciones**

### **Pulse Glow**
```css
animation: pulse-glow 2s infinite;
```

### **Pulse Ring**
```css
animation: pulse-ring 1.5s infinite;
```

### **Scanlines**
```css
animation: scanlines-move 8s linear infinite;
```

### **Shimmer**
```css
animation: shimmer 2s linear infinite;
```

---

## 🔧 **Personalización**

### **Cambiar colores del tema**

```tsx
<div style={{
  '--color-accent-primary': '#FF00FF',
  '--color-secondary': '#FFFF00'
} as React.CSSProperties}>
  <AITECHDevice />
</div>
```

### **Desactivar animaciones**

```tsx
<HexGrid animate={false} />
<HolographicPanel animate={false}>
  Content
</HolographicPanel>
```

---

## 📱 **Estados de llamada**

### **Idle (Reposo)**
- Dialpad visible
- Quick actions
- Sin glow en LED ring

### **Incoming (Entrante)**
- LED ring pulsando rojo
- Avatar con ring animado
- Contexto del cliente
- Botones Answer/Reject

### **Active (Activa)**
- LED ring verde
- Waveform visualizer activo
- Controles completos (mute, hold, transfer)
- Indicadores de calidad en tiempo real

---

## 🎯 **Integración con Twilio**

El softphone está diseñado para integrarse con `@ait-core/ait-comms-softphone`:

```tsx
import { AITECHDevice } from '@ait-core/ait-comms-device';
import { useSoftphone } from '@ait-core/ait-comms-softphone/react';

function IntegratedSoftphone() {
  const softphone = useSoftphone({
    config: twilioConfig,
    onTokenRequest: fetchToken
  });

  return (
    <AITECHDevice
      callState={softphone.isInCall ? 'active' : 'idle'}
      currentCall={softphone.currentCall}
      onAnswer={() => softphone.answerCall()}
      onReject={() => softphone.rejectCall()}
      onHangup={() => softphone.hangUp()}
    />
  );
}
```

---

## 🏗️ **Estructura del proyecto**

```
packages/ait-comms-device/
├── src/
│   ├── Device.tsx                # Contenedor principal
│   ├── AIT_OS_Shell.tsx          # Sistema operativo
│   ├── Softphone_App.tsx         # App de softphone
│   ├── components/
│   │   ├── HexGrid.tsx           # Fondo hexagonal
│   │   ├── HolographicPanel.tsx  # Panel holográfico
│   │   ├── WaveformVisualizer.tsx# Visualizador de audio
│   │   ├── StatusBar.tsx         # Barra superior
│   │   └── DeviceFrame.tsx       # Marco del dispositivo
│   ├── styles/
│   │   ├── device.css            # Estilos del hardware
│   │   ├── ait-os.css            # Estilos del OS
│   │   └── animations.css        # Animaciones FUI
│   └── index.tsx                 # Exports
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎨 **Showcase**

### **Vista del dispositivo completo**

El AINTECH Device simula un dispositivo corporativo real con:
- Marco metálico personalizado
- LED ring de estado
- Botones físicos (power, volumen)
- Altavoces con grille
- Logo AINTECH

### **AIT-OS**

Sistema operativo propietario con:
- Status bar con hora, batería, señal
- Fondo hexagonal animado
- Efectos holográficos
- Gesture bar

### **Softphone App**

Interfaz de llamadas high-tech con:
- Paneles holográficos
- Visualizador de forma de onda
- Indicadores de calidad en tiempo real
- Animaciones suaves

---

## 🚀 **Performance**

- ✅ Animaciones optimizadas con `requestAnimationFrame`
- ✅ Canvas para renderizado eficiente
- ✅ CSS transforms para hardware acceleration
- ✅ Lazy loading de componentes

---

## 📝 **Licencia**

Proprietary - AIT-CORE

---

## 🤝 **Soporte**

Para issues o preguntas:
- 📧 Email: support@ait-core.com
- 💬 GitHub: [Issues](https://github.com/your-repo/issues)

---

**Versión**: 1.0.0
**Autor**: AIT-CORE Development Team
**Fecha**: 2026-01-28
