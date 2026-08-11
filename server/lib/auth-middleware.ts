import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase.js'
import { ApiError } from '../../src/api/errors.js'

/**
 * Validates a JWT token and returns the authenticated user.
 * Server-side version that uses process.env instead of import.meta.env.
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The authenticated user
 * @throws ApiError with 401 if token is missing or invalid
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
      'Sua sessão expirou. Faça login novamente.',
      401,
    )
  }

  return data.user
}
