# 🚀 Quick Start Guide

Get started with AINTECH Device in 5 minutes.

## Installation

```bash
# From the monorepo root
cd packages/ait-comms-device
npm install

# Build the package
npm run build
```

## Basic Usage

### 1. Import the Component

```tsx
import { AITECHDevice } from '@ait-core/ait-comms-device';
```

### 2. Add to Your App

```tsx
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

### 3. Done! 🎉

You now have a fully functional high-tech softphone with:
- Custom AINTECH device frame
- AIT-OS operating system
- VoIP softphone interface
- Call state management
- LED ring animations

## What You Get

### Device Features
- **375x812px** device frame (iPhone-like dimensions, but unique design)
- **LED ring** that changes color based on call state:
  - Gray: Idle
  - Red (pulsing): Incoming call
  - Green: Active call
- **Physical buttons**: Power, Volume Up, Volume Down
- **AINTECH branding** engraved on device

### AIT-OS Features
- **Status bar** with time, signal, WiFi, battery
- **Animated background** with hexagonal grid
- **Gesture bar** iOS-style home indicator
- **Scanline effects** for sci-fi aesthetic

### Softphone Features
- **Dialpad** for making calls
- **Incoming call screen** with caller info
- **Active call screen** with waveform and controls
- **Call quality indicators** (MOS, jitter, latency)

## Interactive Demo

Try the different call states by clicking buttons in the UI:

1. **Idle** → Click a contact or number
2. **Incoming** → Click "Answer" or "Reject"
3. **Active** → Use mute, hold, transfer, or hangup

## Customization

### Change LED Color

```tsx
<DeviceFrame ledRingColor="#FF00FF" ledRingPulsing={true}>
  {/* content */}
</DeviceFrame>
```

### Use Custom Theme

```tsx
<div style={{
  '--color-accent-primary': '#FF00FF',
  '--color-secondary': '#FFFF00'
} as React.CSSProperties}>
  <AITECHDevice />
</div>
```

### Handle Call Events

```tsx
<AITOSShell onCallStateChange={(state) => {
  console.log('Call state:', state);
}}>
  <SoftphoneApp />
</AITOSShell>
```

## Component Breakdown

If you want more control, use individual components:

```tsx
import {
  DeviceFrame,      // Physical device hardware
  AITOSShell,       // Operating system
  SoftphoneApp,     // Softphone application
  HexGrid,          // Animated background
  HolographicPanel, // FUI-style panel
  WaveformVisualizer, // Audio visualization
  StatusBar         // Top status bar
} from '@ait-core/ait-comms-device';
```

## Next Steps

1. **Read the full README** → [README.md](./README.md)
2. **Explore examples** → [example.tsx](./example.tsx)
3. **Integrate with Twilio** → See Example 6 in examples
4. **Customize design** → See Design Tokens in README

## Tips

- Use **Performance Mode** if animations are causing issues (set `animate={false}`)
- LED ring **pulsing** works automatically for incoming calls
- All components are **fully typed** with TypeScript
- **Canvas-based** animations run at 60fps

## Troubleshooting

**Q: Device doesn't render**
- Check that React is version 18+
- Ensure all dependencies are installed

**Q: Animations are laggy**
- Try Performance Mode (disable animations)
- Reduce number of bars in WaveformVisualizer

**Q: TypeScript errors**
- Run `npm run build` to generate type definitions
- Check that @types/react and @types/react-dom are installed

## Support

For issues or questions:
- 📧 Email: support@ait-core.com
- 💬 GitHub: [Issues](https://github.com/your-repo/issues)

---

**Happy coding!** 🚀
