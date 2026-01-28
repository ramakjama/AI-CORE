/**
 * AITECHDevice Component
 * Main device container combining hardware frame, AIT-OS, and Softphone app
 */

import React, { useState } from 'react';
import { DeviceFrame } from './components/DeviceFrame';
import { AITOSShell } from './AIT_OS_Shell';
import { SoftphoneApp } from './Softphone_App';

export const AITECHDevice: React.FC = () => {
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'active'>('idle');

  // LED ring colors based on call state
  const getLedRingColor = () => {
    switch (callState) {
      case 'idle':
        return '#666';
      case 'ringing':
        return '#FF3366';
      case 'active':
        return '#00FF88';
      default:
        return '#666';
    }
  };

  const handleCallStateChange = (state: 'idle' | 'ringing' | 'active') => {
    setCallState(state);
  };

  return (
    <div
      className="aintech-device-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0f1117 50%, #000000 100%)',
        padding: '40px 20px'
      }}
    >
      <DeviceFrame
        ledRingColor={getLedRingColor()}
        ledRingPulsing={callState === 'ringing'}
      >
        <AITOSShell onCallStateChange={handleCallStateChange}>
          <SoftphoneApp onCallStateChange={handleCallStateChange} />
        </AITOSShell>
      </DeviceFrame>

      <style>{`
        .aintech-device-container {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Global animations */
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px currentColor;
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 40px currentColor;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Utility classes */
        .text-gradient-cyan {
          background: linear-gradient(135deg, #00D9FF 0%, #00FFA3 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-cyan {
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
        }

        .glow-red {
          box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
        }

        .glow-green {
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
        }
      `}</style>
    </div>
  );
};
