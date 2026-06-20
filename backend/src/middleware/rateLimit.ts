import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /**
   * Derives the throttle bucket for a request. Defaults to the client IP.
   * Pass a generator that mixes in the target account (e.g. email / userId)
   * to get per-account lockout that a single IP rotation can't evade.
   */
  keyGenerator?: (req: Request) => string;
}

interface Hit {
  count: number;
  resetAt: number;
}

/**
 * Minimal fixed-window in-memory rate limiter for brute-force protection on
 * auth/OTP endpoints. Single-instance only — swap for express-rate-limit + a
 * shared store (Redis) when scaling horizontally. Honors `trust proxy` for
 * correct client IPs behind a load balancer.
 */
export function rateLimit({ windowMs, max, keyGenerator }: RateLimitOptions) {
  const hits = new Map<string, Hit>();
  const keyFor = keyGenerator ?? ((req: Request) => req.ip ?? 'unknown');

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = keyFor(req);
    const hit = hits.get(key);

    if (!hit || hit.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    hit.count += 1;
    if (hit.count > max) {
      const retryAfter = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfter);
      throw ApiError.tooManyRequests('Too many requests, please try again later.');
    }
    next();
  };
}
