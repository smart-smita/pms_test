import jwt from 'jsonwebtoken';
import { env } from './env';
import { UserPayload } from '../types';

export function generateAccessToken(user: UserPayload): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function generateRefreshToken(user: UserPayload): string {
  return jwt.sign({ employee_id: user.employee_id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): UserPayload {
  return jwt.verify(token, env.JWT_SECRET) as UserPayload;
}

export function verifyRefreshToken(token: string): { employee_id: number } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { employee_id: number };
}
