/**
 * AIT_OS_Shell Component
 * AIT-OS Operating System Shell
 * Provides the OS environment with status bar, background, and app container
 */

import React, { ReactNode } from 'react';
import { StatusBar } from './components/StatusBar';
import { HexGrid } from './components/HexGrid';

interface AITOSShellProps {
  children: ReactNode;
  onCallStateChange?: (state: 'idle' | 'ringing' | 'active') => void;
}

export const AITOSShell: React.FC<AITOSShellProps> = ({
  children,
  onCallStateChange
}) => {
  return (
    <div
      className="ait-os-shell"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0E17',
        overflow: 'hidden'
      }}
    >
      {/* Animated hexagonal background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        }}
      >
        <HexGrid animate={true} color="#00D9FF" opacity={0.08} />
      </div>

      {/* Scanlines overlay effect */}
      <div
        className="scanlines-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          )`,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.3
        }}
      />

      {/* Vignette effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.3) 100%
          )`,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Status Bar */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <StatusBar />
      </div>

      {/* App Container */}
      <div
        className="ait-os-app-container"
        style={{
          position: 'relative',
          flex: 1,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {children}
      </div>

      {/* Gesture Bar (iOS-style home indicator) */}
      <div
        className="ait-os-gesture-bar"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 0',
          background: 'linear-gradient(180deg, transparent 0%, rgba(10, 14, 23, 0.6) 100%)'
        }}
      >
        <div
          style={{
            width: '120px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '2px',
            boxShadow: '0 0 8px rgba(0, 217, 255, 0.2)'
          }}
        />
      </div>

      <style>{`
        .ait-os-shell {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Custom scrollbar for OS */
        .ait-os-app-container::-webkit-scrollbar {
          width: 6px;
        }

        .ait-os-app-container::-webkit-scrollbar-track {
          background: rgba(20, 24, 36, 0.3);
        }

        .ait-os-app-container::-webkit-scrollbar-thumb {
          background: rgba(0, 217, 255, 0.3);
          border-radius: 3px;
        }

        .ait-os-app-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 217, 255, 0.5);
        }

        /* Smooth animations */
        .ait-os-shell * {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `}</style>
    </div>
  );
};
