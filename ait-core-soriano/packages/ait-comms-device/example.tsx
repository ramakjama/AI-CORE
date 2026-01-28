/**
 * AINTECH Device - Usage Examples
 *
 * This file demonstrates different ways to use the AINTECH Device components
 */

import React from 'react';
import {
  AITECHDevice,
  AITOSShell,
  SoftphoneApp,
  HexGrid,
  HolographicPanel,
  WaveformVisualizer,
  StatusBar,
  DeviceFrame
} from '@ait-core/ait-comms-device';

// ============================================================================
// Example 1: Complete Device (Simplest usage)
// ============================================================================

export function Example1_CompleteDevice() {
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

// ============================================================================
// Example 2: Custom Device with Event Handling
// ============================================================================

export function Example2_CustomDevice() {
  const handleCallStateChange = (state: 'idle' | 'ringing' | 'active') => {
    console.log('Call state changed to:', state);

    // You can trigger custom logic here:
    // - Update analytics
    // - Send notifications
    // - Update UI in parent component
    // - etc.
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <DeviceFrame ledRingColor="#00D9FF" ledRingPulsing={false}>
        <AITOSShell onCallStateChange={handleCallStateChange}>
          <SoftphoneApp onCallStateChange={handleCallStateChange} />
        </AITOSShell>
      </DeviceFrame>
    </div>
  );
}

// ============================================================================
// Example 3: Using Individual Components
// ============================================================================

export function Example3_IndividualComponents() {
  const [isActive, setIsActive] = React.useState(false);

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#0A0E17',
      padding: '40px'
    }}>
      {/* Animated hexagonal background */}
      <HexGrid animate={true} color="#00D9FF" opacity={0.1} />

      {/* Status bar */}
      <StatusBar />

      {/* Content panels */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '24px'
      }}>
        {/* Primary panel */}
        <HolographicPanel title="SYSTEM STATUS" variant="primary">
          <div style={{ color: '#fff', fontSize: '14px' }}>
            <p>All systems operational</p>
            <p style={{ marginTop: '12px', color: '#00D9FF' }}>
              Response time: 12ms
            </p>
          </div>
        </HolographicPanel>

        {/* Secondary panel */}
        <HolographicPanel title="AUDIO STREAM" variant="secondary">
          <WaveformVisualizer
            isActive={isActive}
            color="#B4FF39"
            bars={40}
            height={80}
          />
          <button
            onClick={() => setIsActive(!isActive)}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: 'rgba(180, 255, 57, 0.2)',
              border: '1px solid #B4FF39',
              borderRadius: '6px',
              color: '#B4FF39',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {isActive ? 'STOP' : 'START'} STREAM
          </button>
        </HolographicPanel>

        {/* Alert panel */}
        <HolographicPanel title="ALERTS" variant="alert" glowIntensity={1.5}>
          <div style={{ color: '#fff', fontSize: '14px' }}>
            <p style={{ color: '#FF3366' }}>⚠ High call volume detected</p>
            <p style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
              Wait time: 2 minutes
            </p>
          </div>
        </HolographicPanel>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Custom Theme/Colors
// ============================================================================

export function Example4_CustomTheme() {
  return (
    <div style={{
      '--color-accent-primary': '#FF00FF',  // Purple instead of cyan
      '--color-secondary': '#FFFF00',       // Yellow instead of lime
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000'
    } as React.CSSProperties}>
      <AITECHDevice />
    </div>
  );
}

// ============================================================================
// Example 5: Without Animations (Performance Mode)
// ============================================================================

export function Example5_PerformanceMode() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: '#0A0E17',
      padding: '40px'
    }}>
      {/* Static background (no animation) */}
      <HexGrid animate={false} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <StatusBar />

        <div style={{ marginTop: '24px' }}>
          <HolographicPanel
            title="PERFORMANCE MODE"
            variant="primary"
            animate={false}  // Disable panel animations
          >
            <p style={{ color: '#fff' }}>
              Animations disabled for better performance
            </p>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Integration with Twilio (Advanced)
// ============================================================================

export function Example6_TwilioIntegration() {
  // This would typically use @ait-core/ait-comms-softphone hooks
  // For demonstration purposes, using mock state

  const [callState, setCallState] = React.useState<'idle' | 'ringing' | 'active'>('idle');
  const [currentCall, setCurrentCall] = React.useState<any>(null);

  // Mock functions - replace with real Twilio integration
  const handleAnswer = () => {
    console.log('Answering call...');
    setCallState('active');
  };

  const handleReject = () => {
    console.log('Rejecting call...');
    setCallState('idle');
    setCurrentCall(null);
  };

  const handleHangup = () => {
    console.log('Hanging up...');
    setCallState('idle');
    setCurrentCall(null);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000'
    }}>
      <DeviceFrame
        ledRingColor={
          callState === 'active' ? '#00FF88' :
          callState === 'ringing' ? '#FF3366' :
          '#666'
        }
        ledRingPulsing={callState === 'ringing'}
      >
        <AITOSShell onCallStateChange={setCallState}>
          <SoftphoneApp onCallStateChange={setCallState} />
        </AITOSShell>
      </DeviceFrame>

      {/* You could add additional UI outside the device here */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: '#00D9FF',
        fontFamily: 'monospace'
      }}>
        State: {callState}
      </div>
    </div>
  );
}

// ============================================================================
// Export all examples
// ============================================================================

export const examples = {
  CompleteDevice: Example1_CompleteDevice,
  CustomDevice: Example2_CustomDevice,
  IndividualComponents: Example3_IndividualComponents,
  CustomTheme: Example4_CustomTheme,
  PerformanceMode: Example5_PerformanceMode,
  TwilioIntegration: Example6_TwilioIntegration
};
