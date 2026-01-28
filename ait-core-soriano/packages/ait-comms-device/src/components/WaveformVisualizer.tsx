/**
 * WaveformVisualizer Component
 * Real-time audio waveform visualization for active calls
 */

import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
  color?: string;
  bars?: number;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  color = '#00D9FF',
  bars = 40,
  height = 60
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const dataRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize data array
    dataRef.current = Array.from({ length: bars }, () => Math.random() * 0.3 + 0.1);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / bars;

      ctx.clearRect(0, 0, width, height);

      dataRef.current.forEach((value, index) => {
        if (isActive) {
          // Animate values when active
          const target = Math.random() * 0.8 + 0.2;
          dataRef.current[index] += (target - value) * 0.15;
        } else {
          // Return to idle state
          dataRef.current[index] += (0.2 - value) * 0.1;
        }

        const barHeight = dataRef.current[index] * height;
        const x = index * barWidth;
        const y = (height - barHeight) / 2;

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, `${color}00`);
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, `${color}00`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, bars, color]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'block'
      }}
    />
  );
};
