import React from 'react';
import { cn } from '../../utils/cn';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  sparkline?: number[];
  className?: string;
}

const statusColors = {
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  danger: 'border-l-red-500',
  neutral: 'border-l-gray-400',
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-500',
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  trend = 'stable',
  status = 'neutral',
  icon,
  sparkline,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        'border-l-4',
        statusColors[status],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          
          {change !== undefined && (
            <div className={cn('mt-2 flex items-center text-sm', trendColors[trend])}>
              {trend === 'up' && (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="ml-1 text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 p-3 bg-gray-100 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      
      {sparkline && sparkline.length > 0 && (
        <div className="mt-4 h-12">
          <Sparkline data={sparkline} />
        </div>
      )}
    </div>
  );
};

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
      />
    </svg>
  );
};
