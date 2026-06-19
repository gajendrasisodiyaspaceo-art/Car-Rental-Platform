import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface Hit {
  count: number;
  resetAt: number;
}

/**
 * Minimal fixed-window in-memory rate limiter for brute-force protection on
 * auth/OTP endpoints. Sufficient for a single instance; swap for
 * express-rate-limit + a shared store (Redis) when scaling horizontally.
 */
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, Hit>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const hit = hits.get(key);

    if (!hit || hit.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    hit.count += 1;
    if (hit.count > max) {
      throw ApiError.tooManyRequests('Too many requests, please try again later.');
    }
    next();
  };
}
