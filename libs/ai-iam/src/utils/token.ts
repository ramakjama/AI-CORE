import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-core-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
// Note: Refresh token expiration is handled at the application level

export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(): string {
  return uuidv4() + '-' + uuidv4();
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenExpiration(expiresIn: string = JWT_EXPIRES_IN): Date {
  const match = expiresIn.match(/(\d+)([dhms])/);
  if (!match || !match[1] || !match[2]) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as 'd' | 'h' | 'm' | 's';

  const msMap: Record<string, number> = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const ms = msMap[unit] ?? 86400000;
  return new Date(Date.now() + value * ms);
}
