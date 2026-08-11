import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): string | null {
  if (!email) return 'Formato de email inválido'
  if (!EMAIL_REGEX.test(email)) return 'Formato de email inválido'
  return null
}

export function LoginForm() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect back to the page the user was trying to access, or fall back to /
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)

    // Validate email format
    const emailValidationError = validateEmail(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      return
    }
    setEmailError(null)

    setIsSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch {
      setAuthError('Email ou senha incorretos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError(validateEmail(value))
    }
  }

  return (
    <div className="auth-form-container">
      <h1 className="auth-title">Entrar</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {authError && (
          <div className="auth-error" role="alert">
            {authError}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={`auth-input${emailError ? ' auth-input--error' : ''}`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
            aria-describedby={emailError ? 'login-email-error' : undefined}
            aria-invalid={emailError ? 'true' : undefined}
          />
          {emailError && (
            <span
              id="login-email-error"
              className="auth-field-error"
              role="alert"
            >
              {emailError}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">
            Senha
          </label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </div>

        <p className="auth-switch auth-switch--compact">
          <Link to="/forgot-password" className="auth-link">
            Esqueceu sua senha?
          </Link>
        </p>

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="auth-switch">
        Não tem uma conta?{' '}
        <Link to="/register" className="auth-link">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
