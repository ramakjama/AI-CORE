/**
 * DeviceFrame Component
 * Physical device hardware simulation with high-tech aesthetic
 */

import React, { ReactNode } from 'react';
import { Power, VolumeX, Volume2 } from 'lucide-react';

interface DeviceFrameProps {
  children: ReactNode;
  ledRingColor?: string;
  ledRingPulsing?: boolean;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  ledRingColor = '#666',
  ledRingPulsing = false
}) => {
  return (
    <div
      className="device-frame"
      style={{
        position: 'relative',
        width: '375px',
        height: '812px',
        background: 'linear-gradient(135deg, #1a1d28 0%, #0f1117 100%)',
        borderRadius: '48px',
        padding: '12px',
        boxShadow: `
          0 24px 48px rgba(0, 0, 0, 0.8),
          0 0 0 1px rgba(255, 255, 255, 0.05),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.5)
        `,
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* LED Ring around screen */}
      <div
        className="device-led-ring"
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          bottom: '8px',
          borderRadius: '44px',
          border: `2px solid ${ledRingColor}`,
          boxShadow: `
            0 0 20px ${ledRingColor}40,
            inset 0 0 20px ${ledRingColor}20
          `,
          pointerEvents: 'none',
          zIndex: 10,
          animation: ledRingPulsing ? 'pulse-ring 1.5s ease-in-out infinite' : 'none'
        }}
      />

      {/* Top notch area */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '180px',
          height: '28px',
          background: '#0A0E17',
          borderRadius: '0 0 16px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          zIndex: 20,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Camera */}
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a1d28 0%, #000 100%)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8)'
          }}
        />
        {/* Speaker grille */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: '8px',
                background: 'rgba(0, 217, 255, 0.15)',
                borderRadius: '1px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Power button */}
      <button
        className="device-button device-button-power"
        style={{
          position: 'absolute',
          right: '-2px',
          top: '120px',
          width: '4px',
          height: '60px',
          background: 'linear-gradient(90deg, #2a2d38 0%, #1a1d28 100%)',
          border: 'none',
          borderRadius: '2px 0 0 2px',
          boxShadow: `
            inset 1px 0 2px rgba(0, 0, 0, 0.8),
            -1px 0 4px rgba(0, 217, 255, 0.1)
          `,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            inset 1px 0 2px rgba(0, 0, 0, 0.8),
            -2px 0 8px rgba(0, 217, 255, 0.3)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            inset 1px 0 2px rgba(0, 0, 0, 0.8),
            -1px 0 4px rgba(0, 217, 255, 0.1)
          `;
        }}
      />

      {/* Volume up button */}
      <button
        className="device-button device-button-volume-up"
        style={{
          position: 'absolute',
          left: '-2px',
          top: '100px',
          width: '4px',
          height: '40px',
          background: 'linear-gradient(90deg, #1a1d28 0%, #2a2d38 100%)',
          border: 'none',
          borderRadius: '0 2px 2px 0',
          boxShadow: `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            1px 0 4px rgba(0, 217, 255, 0.1)
          `,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            2px 0 8px rgba(0, 217, 255, 0.3)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            1px 0 4px rgba(0, 217, 255, 0.1)
          `;
        }}
      />

      {/* Volume down button */}
      <button
        className="device-button device-button-volume-down"
        style={{
          position: 'absolute',
          left: '-2px',
          top: '150px',
          width: '4px',
          height: '40px',
          background: 'linear-gradient(90deg, #1a1d28 0%, #2a2d38 100%)',
          border: 'none',
          borderRadius: '0 2px 2px 0',
          boxShadow: `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            1px 0 4px rgba(0, 217, 255, 0.1)
          `,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            2px 0 8px rgba(0, 217, 255, 0.3)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            inset -1px 0 2px rgba(0, 0, 0, 0.8),
            1px 0 4px rgba(0, 217, 255, 0.1)
          `;
        }}
      />

      {/* Bottom speaker grille */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '3px',
          zIndex: 20
        }}
      >
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: '12px',
              background: 'rgba(0, 217, 255, 0.1)',
              borderRadius: '1.5px',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)'
            }}
          />
        ))}
      </div>

      {/* AINTECH logo engraving */}
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: 'rgba(0, 217, 255, 0.3)',
          textShadow: '0 1px 0 rgba(0, 0, 0, 0.5)',
          zIndex: 20
        }}
      >
        AINTECH
      </div>

      {/* Screen content */}
      <div
        className="device-screen"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: '#0A0E17',
          borderRadius: '36px',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)'
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.02);
          }
        }

        .device-button:active {
          transform: translateY(1px);
        }

        .device-frame {
          user-select: none;
        }
      `}</style>
    </div>
  );
};
