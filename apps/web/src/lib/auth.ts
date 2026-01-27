/**
 * Authentication utilities for AIT-CORE
 */

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  department?: string;
  jobTitle?: string;
  roles: string[];
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
}

const ALLOWED_DOMAINS = ['sorianomediadores.es', 'ain-tech.cloud'];

/**
 * Check if email domain is allowed
 */
export function isAllowedDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? ALLOWED_DOMAINS.includes(domain) : false;
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Get stored tokens from localStorage
 */
export function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
  };
}

/**
 * Store authentication data
 */
export function storeAuth(user: User, tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', tokens.accessToken);

  if (tokens.refreshToken) {
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
}

/**
 * Clear stored authentication data
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredTokens()?.accessToken;
}

/**
 * Check if user has required role
 */
export function hasRole(role: string): boolean {
  const user = getStoredUser();
  return user?.roles?.includes(role) || user?.roles?.includes('admin') || false;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const user = getStoredUser();
  if (!user?.roles) return false;
  if (user.roles.includes('admin')) return true;
  return roles.some(role => user.roles.includes(role));
}
