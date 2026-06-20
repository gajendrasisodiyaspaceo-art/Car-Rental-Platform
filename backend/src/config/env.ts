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

// `trust proxy` for Express so req.ip is the real client behind a load
// balancer. Default false (don't trust X-Forwarded-For) — set TRUST_PROXY only
// when actually behind a proxy, e.g. TRUST_PROXY=1 or TRUST_PROXY=loopback.
// In production a wildcard CORS origin is unsafe (especially with credentials);
// require an explicit allowlist. Dev/test may default to '*'.
function resolveCorsOrigin(): string {
  const origin = process.env.CORS_ORIGIN;
  if (nodeEnv === 'production') {
    if (!origin || origin.trim() === '*' || origin.trim() === '') {
      throw new Error('CORS_ORIGIN must be an explicit allowlist (not "*") in production.');
    }
    return origin;
  }
  return origin ?? '*';
}

function resolveTrustProxy(): boolean | number | string {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw === '') return false;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/car_rental'),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
  corsOrigin: resolveCorsOrigin(),
  trustProxy: resolveTrustProxy(),
} as const;
