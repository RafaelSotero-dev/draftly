import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthCallbackPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    navigate(user ? '/' : '/login', { replace: true })
  }, [isLoading, navigate, user])

  return (
    <main className="auth-page">
      <div className="auth-form-container">
        <h1 className="auth-title">Autenticando…</h1>
        <p className="auth-helper">Finalizando seu acesso.</p>
      </div>
    </main>
  )
}
