import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../types';

export interface JwtPayload {
  sub: string;
  role: Role;
  providerId?: string;
}

export function signToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
}
