import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

interface ErrorResponse {
  statusCode: number;
  body: { success: false; message: string; details?: unknown };
}

/**
 * Map any thrown value to a sanitized client response. Unexpected/internal
 * errors collapse to a generic 500 so raw error text — including Mongo driver
 * messages (E11000, CastError, validation detail) — is never leaked to clients.
 */
export function toErrorResponse(err: unknown): ErrorResponse {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      body: {
        success: false,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return { statusCode: 400, body: { success: false, message: 'Validation failed' } };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, body: { success: false, message: 'Invalid identifier' } };
  }
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return { statusCode: 409, body: { success: false, message: 'Duplicate value' } };
  }
  return { statusCode: 500, body: { success: false, message: 'Internal server error' } };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const { statusCode, body } = toErrorResponse(err);
  // Only the unexpected (5xx) class is worth a server-side stack; client-class
  // errors (4xx) are expected and would be log noise.
  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }
  res.status(statusCode).json(body);
}
