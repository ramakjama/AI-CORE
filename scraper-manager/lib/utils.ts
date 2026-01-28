import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = async (attemptNumber: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (attemptNumber >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(() => attempt(attemptNumber + 1), delay * attemptNumber);
        }
      }
    };
    attempt(1);
  });
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    RUNNING: 'text-blue-600 bg-blue-100',
    STOPPED: 'text-gray-600 bg-gray-100',
    ERROR: 'text-red-600 bg-red-100',
    PAUSED: 'text-yellow-600 bg-yellow-100',
    COMPLETED: 'text-green-600 bg-green-100',
    ACTIVE: 'text-green-600 bg-green-100',
    INACTIVE: 'text-gray-600 bg-gray-100',
    PENDING: 'text-yellow-600 bg-yellow-100',
  };
  return statusColors[status] || 'text-gray-600 bg-gray-100';
}

export function getLogLevelColor(level: string): string {
  const levelColors: Record<string, string> = {
    DEBUG: 'text-gray-600',
    INFO: 'text-blue-600',
    WARN: 'text-yellow-600',
    ERROR: 'text-red-600',
    FATAL: 'text-red-900',
  };
  return levelColors[level] || 'text-gray-600';
}
