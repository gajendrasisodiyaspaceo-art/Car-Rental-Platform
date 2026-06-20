import { Request, Response, NextFunction } from 'express';

/**
 * Recursively remove MongoDB operator keys from a value. Keys beginning with
 * `$` (e.g. `$ne`, `$gt`, `$where`) or containing a `.` are stripped, so a
 * crafted querystring like `?status[$ne]=x` can never reach a Mongoose filter.
 * Mutates the object in place and returns it. Primitives pass through untouched.
 */
export function stripOperators<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach((item) => stripOperators(item));
    return value;
  }
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete (value as Record<string, unknown>)[key];
      } else {
        stripOperators((value as Record<string, unknown>)[key]);
      }
    }
  }
  return value;
}

/**
 * Global defense-in-depth against NoSQL operator injection. Sanitizes
 * req.body, req.query, and req.params before any handler builds a query.
 * Express 4 query objects are mutable, so we sanitize in place.
 */
export function sanitizeMongo(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) stripOperators(req.body);
  if (req.query) stripOperators(req.query as Record<string, unknown>);
  if (req.params) stripOperators(req.params as Record<string, unknown>);
  next();
}
