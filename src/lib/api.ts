import { supabase } from './supabase'
import { ApiError } from '../api/errors'

const BASE_URL = import.meta.env['BASE_API_URL'] || 'http://localhost:3001'

/**
 * Retrieves the current session's Bearer token from Supabase.
 * Returns null if the user is not authenticated.
 */
async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Builds the Authorization header value.
 * Throws ApiError 401 if no session is available.
 */
async function buildAuthHeader(): Promise<string> {
  const token = await getAuthToken()
  if (!token) {
    throw new ApiError(
      'AUTH.NO_TOKEN',
      'Token de autenticação não fornecido',
      401,
    )
  }
  return `Bearer ${token}`
}

/**
 * Parses an error response from the server and throws an ApiError.
 * Falls back to a generic error if the response body is not JSON.
 */
async function throwApiError(response: Response): Promise<never> {
  let code = 'SYSTEM.CONNECTION_ERROR'
  let message = 'Erro de conexão. Verifique sua internet.'
  const status = response.status

  try {
    const body = (await response.json()) as {
      code?: string
      message?: string
      status?: number
    }
    code = body.code ?? code
    message = body.message ?? message
  } catch {
    // Response body is not JSON — use defaults above
  }

  throw new ApiError(code, message, status)
}

/**
 * Typed HTTP client that automatically injects the Bearer token from the
 * current Supabase session into every request.
 *
 * All methods throw `ApiError` on non-2xx responses.
 */
export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const authorization = await buildAuthHeader()
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: { Authorization: authorization },
    })
    if (!response.ok) return throwApiError(response)
    return response.json() as Promise<T>
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const authorization = await buildAuthHeader()
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : null,
    })
    if (!response.ok) return throwApiError(response)
    // 204 No Content — return undefined cast to T
    if (response.status === 204) return undefined as unknown as T
    return response.json() as Promise<T>
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const authorization = await buildAuthHeader()
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : null,
    })
    if (!response.ok) return throwApiError(response)
    return response.json() as Promise<T>
  },

  async delete(path: string): Promise<void> {
    const authorization = await buildAuthHeader()
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { Authorization: authorization },
    })
    if (!response.ok) return throwApiError(response)
  },
}
