/**
 * HolographicPanel Component
 * FUI-style panel with holographic effects
 */

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface HolographicPanelProps {
  children: ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'alert';
  glowIntensity?: number;
  animate?: boolean;
  className?: string;
}

export const HolographicPanel: React.FC<HolographicPanelProps> = ({
  children,
  title,
  variant = 'primary',
  glowIntensity = 1,
  animate = true,
  className = ''
}) => {
  const variantColors = {
    primary: {
      border: 'rgba(0, 217, 255, 0.3)',
      glow: 'rgba(0, 217, 255, 0.2)',
      accent: '#00D9FF'
    },
    secondary: {
      border: 'rgba(180, 255, 57, 0.3)',
      glow: 'rgba(180, 255, 57, 0.2)',
      accent: '#B4FF39'
    },
    alert: {
      border: 'rgba(255, 51, 102, 0.3)',
      glow: 'rgba(255, 51, 102, 0.2)',
      accent: '#FF3366'
    }
  };

  const colors = variantColors[variant];

  const panelVariants = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  } : {};

  return (
    <motion.div
      className={`holographic-panel ${className}`}
      variants={panelVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(20, 24, 36, 0.7) 0%, rgba(30, 36, 51, 0.5) 100%)',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(16px)',
        boxShadow: `0 8px 32px ${colors.glow}, 0 0 ${20 * glowIntensity}px ${colors.glow}`
      }}
    >
      {/* Corner accents */}
      <div className="panel-corner panel-corner--tl" style={{ borderColor: colors.accent }} />
      <div className="panel-corner panel-corner--tr" style={{ borderColor: colors.accent }} />
      <div className="panel-corner panel-corner--bl" style={{ borderColor: colors.accent }} />
      <div className="panel-corner panel-corner--br" style={{ borderColor: colors.accent }} />

      {/* Scan line effect */}
      <div
        className="panel-scanline"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors.glow}, transparent)`
        }}
      />

      {/* Title bar */}
      {title && (
        <div
          className="panel-title-bar"
          style={{
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: '12px',
            paddingBottom: '8px'
          }}
        >
          <div className="panel-title" style={{ color: colors.accent }}>
            {title}
          </div>
          <div className="panel-status-dot" style={{ background: colors.accent }} />
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {children}
      </div>

      <style>{`
        .holographic-panel {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .holographic-panel:hover {
          transform: translateY(-2px);
        }

        .panel-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border-style: solid;
          border-width: 0;
          transition: all 0.3s ease;
        }

        .panel-corner--tl {
          top: -1px;
          left: -1px;
          border-top-width: 2px;
          border-left-width: 2px;
        }

        .panel-corner--tr {
          top: -1px;
          right: -1px;
          border-top-width: 2px;
          border-right-width: 2px;
        }

        .panel-corner--bl {
          bottom: -1px;
          left: -1px;
          border-bottom-width: 2px;
          border-left-width: 2px;
        }

        .panel-corner--br {
          bottom: -1px;
          right: -1px;
          border-bottom-width: 2px;
          border-right-width: 2px;
        }

        .panel-scanline {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          pointer-events: none;
          opacity: 0.3;
          animation: scanline-move 3s linear infinite;
        }

        @keyframes scanline-move {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(calc(100% + 100px)); }
        }

        .panel-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-title {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .panel-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </motion.div>
  );
};
