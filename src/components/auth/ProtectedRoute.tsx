import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Wraps a route that requires authentication.
 * Redirects unauthenticated users to /login, preserving the intended
 * destination URL in location state so they can be redirected back after login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <section id="center">
        <p>Carregando…</p>
      </section>
    )
  }

  if (!user) {
    // Preserve the current URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
