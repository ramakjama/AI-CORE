"use client";

import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartConfiguration,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartElementProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  options?: any;
  width?: number;
  height?: number;
}

export function ChartElement({
  type,
  data,
  options = {},
  width = 400,
  height = 300,
}: ChartElementProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Default options
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#ffffff',
          },
        },
        title: {
          display: false,
        },
      },
      scales:
        type !== 'pie' && type !== 'doughnut'
          ? {
              y: {
                ticks: {
                  color: '#ffffff',
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
              },
              x: {
                ticks: {
                  color: '#ffffff',
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
              },
            }
          : undefined,
    };

    const config: ChartConfiguration = {
      type: type as any,
      data,
      options: { ...defaultOptions, ...options },
    };

    chartRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// Preset chart configurations
export const chartPresets = {
  line: {
    type: 'line' as const,
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Sales',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
      ],
    },
  },
  bar: {
    type: 'bar' as const,
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Revenue',
          data: [65, 59, 80, 81],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
        },
      ],
    },
  },
  pie: {
    type: 'pie' as const,
    data: {
      labels: ['Red', 'Blue', 'Yellow'],
      datasets: [
        {
          data: [300, 50, 100],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
          ],
        },
      ],
    },
  },
  doughnut: {
    type: 'doughnut' as const,
    data: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      datasets: [
        {
          data: [55, 35, 10],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
          ],
        },
      ],
    },
  },
};
