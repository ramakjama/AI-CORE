/**
 * HexGrid Component
 * Animated hexagonal grid background with FUI aesthetic
 */

import React, { useEffect, useRef } from 'react';

interface HexGridProps {
  animate?: boolean;
  color?: string;
  opacity?: number;
}

export const HexGrid: React.FC<HexGridProps> = ({
  animate = true,
  color = '#00D9FF',
  opacity = 0.1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Hexagon parameters
    const hexRadius = 20;
    const hexHeight = Math.sqrt(3) * hexRadius;
    const hexWidth = 2 * hexRadius;

    const cols = Math.ceil(canvas.width / (hexWidth * 0.75)) + 2;
    const rows = Math.ceil(canvas.height / hexHeight) + 2;

    // Hexagon grid data
    const hexagons: Array<{
      x: number;
      y: number;
      pulsePhase: number;
      pulseSpeed: number;
    }> = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexWidth * 0.75;
        const y = row * hexHeight + (col % 2) * (hexHeight / 2);

        hexagons.push({
          x,
          y,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.5 + Math.random() * 1.5
        });
      }
    }

    // Draw hexagon
    const drawHexagon = (x: number, y: number, radius: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + radius * Math.cos(angle);
        const hy = y + radius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();

      ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Animation loop
    let animationFrame: number;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      hexagons.forEach((hex) => {
        // Calculate pulse effect
        const pulse = animate
          ? Math.sin(time * hex.pulseSpeed + hex.pulsePhase) * 0.5 + 0.5
          : 0.5;

        const alpha = opacity * pulse;

        // Draw hexagon
        drawHexagon(hex.x, hex.y, hexRadius, alpha);

        // Draw center dot (randomly)
        if (Math.random() > 0.98) {
          ctx.fillStyle = `rgba(0, 217, 255, ${alpha * 2})`;
          ctx.beginPath();
          ctx.arc(hex.x, hex.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      time += 0.016; // ~60fps

      if (animate) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animate, color, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="hex-grid-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};
