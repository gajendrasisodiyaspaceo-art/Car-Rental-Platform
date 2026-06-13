import { AuthUser } from '../middleware/auth';
import { ApiError } from './ApiError';

/**
 * Resolves the provider a request operates within. A `provider` user *is* the
 * provider; `staff`/`admin` carry the provider they belong to in the token.
 */
export function providerScope(user?: AuthUser): string {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'provider') return user.id;
  if (user.providerId) return user.providerId;
  throw ApiError.forbidden('No provider scope for this user');
}
