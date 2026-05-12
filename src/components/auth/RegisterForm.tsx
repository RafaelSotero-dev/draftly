import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validateEmail(email: string): string | null {
  if (!email) return 'Formato de email inválido'
  if (!EMAIL_REGEX.test(email)) return 'Formato de email inválido'
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'A senha deve ter no mínimo 8 caracteres'
  }
  return null
}

function validateConfirmPassword(
  password: string,
  confirm: string,
): string | null {
  if (password !== confirm) return 'As senhas não coincidem'
  return null
}

export function RegisterForm() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)

    // Validate all fields
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    const confirmErr = validateConfirmPassword(password, confirmPassword)

    setEmailError(emailErr)
    setPasswordError(passwordErr)
    setConfirmPasswordError(confirmErr)

    if (emailErr || passwordErr || confirmErr) return

    setIsSubmitting(true)
    try {
      await signUp(email, password)
      // Supabase sends a confirmation email; navigate to home or show message
      navigate('/')
    } catch (err: unknown) {
      const message =
        err instanceof Error &&
        err.message.toLowerCase().includes('already registered')
          ? 'Este email já está cadastrado'
          : 'Este email já está cadastrado'
      setAuthError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) setEmailError(validateEmail(value))
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (passwordError) setPasswordError(validatePassword(value))
    if (confirmPasswordError)
      setConfirmPasswordError(validateConfirmPassword(value, confirmPassword))
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (confirmPasswordError)
      setConfirmPasswordError(validateConfirmPassword(password, value))
  }

  return (
    <div className="auth-form-container">
      <h1 className="auth-title">Criar conta</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {authError && (
          <div className="auth-error" role="alert">
            {authError}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="register-email" className="auth-label">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className={`auth-input${emailError ? ' auth-input--error' : ''}`}
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
            aria-describedby={emailError ? 'register-email-error' : undefined}
            aria-invalid={emailError ? 'true' : undefined}
          />
          {emailError && (
            <span
              id="register-email-error"
              className="auth-field-error"
              role="alert"
            >
              {emailError}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password" className="auth-label">
            Senha
          </label>
          <input
            id="register-password"
            type="password"
            className={`auth-input${passwordError ? ' auth-input--error' : ''}`}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            aria-describedby={
              passwordError ? 'register-password-error' : undefined
            }
            aria-invalid={passwordError ? 'true' : undefined}
          />
          {passwordError && (
            <span
              id="register-password-error"
              className="auth-field-error"
              role="alert"
            >
              {passwordError}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password" className="auth-label">
            Confirmar senha
          </label>
          <input
            id="register-confirm-password"
            type="password"
            className={`auth-input${confirmPasswordError ? ' auth-input--error' : ''}`}
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            aria-describedby={
              confirmPasswordError ? 'register-confirm-error' : undefined
            }
            aria-invalid={confirmPasswordError ? 'true' : undefined}
          />
          {confirmPasswordError && (
            <span
              id="register-confirm-error"
              className="auth-field-error"
              role="alert"
            >
              {confirmPasswordError}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="auth-switch">
        Já tem uma conta?{' '}
        <Link to="/login" className="auth-link">
          Entrar
        </Link>
      </p>
    </div>
  )
}
