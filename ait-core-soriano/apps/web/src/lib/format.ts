// Formatting utilities
import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Date formatting
export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatDateTimeSeconds = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm:ss');
};

export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, new Date(), { locale: es });
};

export const formatDistanceToNow = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: es });
};

// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

// Number formatting
export const formatNumber = (
  value: number,
  decimals: number = 0,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${formatNumber(value, decimals)}%`;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }

  if (cleaned.length === 11 && cleaned.startsWith('34')) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
  }

  return phone;
};

// Tax ID formatting (NIF/CIF)
export const formatTaxId = (taxId: string): string => {
  const cleaned = taxId.replace(/\s/g, '').toUpperCase();

  if (cleaned.length === 9) {
    return cleaned.replace(/(\w{8})(\w)/, '$1-$2');
  }

  return taxId;
};

// Policy number formatting
export const formatPolicyNumber = (policyNumber: string): string => {
  const cleaned = policyNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  if (cleaned.length >= 8) {
    return cleaned.replace(/(\w{4})(\w{4})(.*)/, '$1-$2-$3');
  }

  return policyNumber;
};

// Claim number formatting
export const formatClaimNumber = (claimNumber: string): string => {
  const cleaned = claimNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  if (cleaned.length >= 6) {
    return cleaned.replace(/(\w{3})(\w{3})(.*)/, 'CLM-$1-$2-$3');
  }

  return claimNumber;
};

// Name formatting
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Address formatting
export const formatAddress = (address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): string => {
  return `${address.street}, ${address.zipCode} ${address.city}, ${address.state}, ${address.country}`;
};

// Truncate text
export const truncate = (text: string, length: number = 50, suffix: string = '...'): string => {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Title case
export const toTitleCase = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Slug generation
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// ID generation
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
};

// Color utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: 'green',
    inactive: 'gray',
    pending: 'yellow',
    approved: 'green',
    denied: 'red',
    cancelled: 'red',
    expired: 'orange',
    suspended: 'orange',
    'under-review': 'blue',
    paid: 'green',
    closed: 'gray',
    submitted: 'blue',
  };

  return statusColors[status.toLowerCase()] || 'gray';
};

export const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red',
  };

  return priorityColors[priority.toLowerCase()] || 'gray';
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T>(array: T[], key: keyof T): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

// Object utilities
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {} as Pick<T, K>);
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Debounce and throttle
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch {
    return false;
  }
};

// Download utilities
export const downloadJSON = (data: any, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCSV = (data: any[], filename: string): void => {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => Object.values(item).join(',')).join('\n');
  const csv = `${headers}\n${rows}`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
