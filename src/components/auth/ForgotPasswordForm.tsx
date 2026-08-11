import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): string | null {
  if (!email) return 'Formato de email inválido'
  if (!EMAIL_REGEX.test(email)) return 'Formato de email inválido'
  return null
}

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)
    setSuccessMessage(null)

    const emailValidationError = validateEmail(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      return
    }

    setEmailError(null)
    setIsSubmitting(true)

    try {
      await requestPasswordReset(email)
      setSuccessMessage(
        'Enviamos um link de recuperação para o seu email. Verifique a caixa de entrada e o spam.',
      )
    } catch {
      setAuthError('Não foi possível enviar o link de recuperação')
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
      <h1 className="auth-title">Recuperar senha</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {authError && (
          <div className="auth-error" role="alert">
            {authError}
          </div>
        )}

        {successMessage && (
          <div className="auth-message auth-message--success" role="status">
            {successMessage}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="forgot-password-email" className="auth-label">
            Email
          </label>
          <input
            id="forgot-password-email"
            type="email"
            className={`auth-input${emailError ? ' auth-input--error' : ''}`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
            aria-describedby={
              emailError ? 'forgot-password-email-error' : undefined
            }
            aria-invalid={emailError ? 'true' : undefined}
          />
          {emailError && (
            <span
              id="forgot-password-email-error"
              className="auth-field-error"
              role="alert"
            >
              {emailError}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Enviando…' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="auth-switch">
        Lembrou da senha?{' '}
        <Link to="/login" className="auth-link">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
