import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload, expiresIn = '7d'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
