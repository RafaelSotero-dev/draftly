import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Wraps a route that should only be accessible to unauthenticated users
 * (e.g. login, register). Redirects authenticated users to the dashboard.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <section id="center">
        <p>Carregando…</p>
      </section>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
