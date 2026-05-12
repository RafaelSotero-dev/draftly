import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { ApiError, ERROR_MESSAGES } from '../api/errors'

/**
 * Validates a JWT token and returns the authenticated user.
 *
 * This function is designed to be used as authentication middleware.
 * It extracts the Bearer token from an Authorization header, validates it
 * via Supabase, and returns the user or throws an appropriate error.
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The authenticated user
 * @throws ApiError with 401 if token is missing or invalid
 *
 * @example
 * // In an API route handler:
 * const authHeader = request.headers.get('Authorization')
 * const user = await validateToken(authHeader)
 * // user.id can now be used for data isolation
 */
export async function validateToken(
  authHeader: string | null | undefined,
): Promise<User> {
  if (!authHeader) {
    throw new ApiError(
      'AUTH.NO_TOKEN',
      'Token de autenticação não fornecido',
      401,
    )
  }

  // Extract Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match || !match[1]) {
    throw new ApiError('AUTH.INVALID_TOKEN', 'Formato de token inválido', 401)
  }

  const token = match[1]

  // Validate via Supabase
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new ApiError(
      'AUTH.INVALID_TOKEN',
      ERROR_MESSAGES['AUTH.SESSION_EXPIRED'],
      401,
    )
  }

  return data.user
}

/**
 * Extracts the user ID from a validated token.
 * Convenience wrapper around validateToken for cases where only the ID is needed.
 *
 * @param authHeader - The Authorization header value
 * @returns The authenticated user's ID
 * @throws ApiError with 401 if token is missing or invalid
 */
export async function getUserIdFromToken(
  authHeader: string | null | undefined,
): Promise<string> {
  const user = await validateToken(authHeader)
  return user.id
}
