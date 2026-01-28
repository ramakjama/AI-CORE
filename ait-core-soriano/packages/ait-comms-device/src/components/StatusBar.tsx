/**
 * StatusBar Component
 * AIT-OS top status bar with system information
 */

import React, { useState, useEffect } from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';

interface StatusBarProps {
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ className = '' }) => {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(85);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div
      className={`status-bar ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'linear-gradient(180deg, rgba(10, 14, 23, 0.95) 0%, rgba(10, 14, 23, 0.8) 100%)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 217, 255, 0.1)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        fontWeight: 500,
        color: '#fff',
        height: '32px'
      }}
    >
      {/* Left side - Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#00D9FF', letterSpacing: '0.05em' }}>
          {formatTime(time)}
        </span>
      </div>

      {/* Center - AIT-OS Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#00D9FF',
          fontSize: '11px',
          letterSpacing: '0.1em',
          fontWeight: 600
        }}
      >
        <div
          style={{
            width: '4px',
            height: '4px',
            background: '#00D9FF',
            borderRadius: '50%',
            animation: 'pulse-dot 2s ease-in-out infinite'
          }}
        />
        AIT-OS
      </div>

      {/* Right side - System icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Signal strength */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Signal size={14} strokeWidth={2.5} color="#00D9FF" />
          <span style={{ fontSize: '10px', color: '#00D9FF' }}>5G</span>
        </div>

        {/* WiFi */}
        <Wifi size={14} strokeWidth={2.5} color="#00D9FF" />

        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Battery size={14} strokeWidth={2.5} color="#00D9FF" />
          <span style={{ fontSize: '10px', color: '#00D9FF' }}>
            {battery}%
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};
