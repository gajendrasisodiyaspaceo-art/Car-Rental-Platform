import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const INSECURE_JWT_DEFAULTS = ['change-me-in-production', 'change-me', 'secret'];

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (nodeEnv === 'production') {
    if (!secret || INSECURE_JWT_DEFAULTS.includes(secret) || secret.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (>= 32 chars) in production.',
      );
    }
    return secret;
  }
  // Dev/test: allow a fallback so the app still boots locally.
  return secret ?? 'dev-insecure-secret-do-not-use-in-production';
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/car_rental'),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
} as const;
