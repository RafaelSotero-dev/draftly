import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MIN_PASSWORD_LENGTH = 8

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'A senha deve ter no mínimo 8 caracteres'
  }
  return null
}

function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | null {
  if (password !== confirmPassword) return 'As senhas não coincidem'
  return null
}

export function ResetPasswordForm() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setHasRecoverySession(Boolean(data.session))
      setIsCheckingSession(false)
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasRecoverySession(Boolean(session))
        setIsCheckingSession(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError(null)

    const passwordErr = validatePassword(password)
    const confirmErr = validateConfirmPassword(password, confirmPassword)

    setPasswordError(passwordErr)
    setConfirmPasswordError(confirmErr)

    if (passwordErr || confirmErr) return
    if (!hasRecoverySession) {
      setAuthError('O link de recuperação é inválido ou expirou')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword(password)
      navigate('/', { replace: true })
    } catch {
      setAuthError('Não foi possível atualizar a senha')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (passwordError) setPasswordError(validatePassword(value))
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(value, confirmPassword))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (confirmPasswordError) {
      setConfirmPasswordError(validateConfirmPassword(password, value))
    }
  }

  if (isCheckingSession) {
    return (
      <div className="auth-form-container">
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-helper">Verificando seu link de recuperação…</p>
      </div>
    )
  }

  if (!hasRecoverySession) {
    return (
      <div className="auth-form-container">
        <h1 className="auth-title">Recuperar senha</h1>
        <p className="auth-helper">
          Este link expirou ou não é válido. Solicite um novo link.
        </p>
        <p className="auth-switch auth-switch--compact">
          <Link to="/forgot-password" className="auth-link">
            Pedir novo link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-form-container">
      <h1 className="auth-title">Definir nova senha</h1>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {authError && (
          <div className="auth-error" role="alert">
            {authError}
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="reset-password" className="auth-label">
            Nova senha
          </label>
          <input
            id="reset-password"
            type="password"
            className={`auth-input${passwordError ? ' auth-input--error' : ''}`}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            aria-describedby={
              passwordError ? 'reset-password-error' : undefined
            }
            aria-invalid={passwordError ? 'true' : undefined}
          />
          {passwordError && (
            <span
              id="reset-password-error"
              className="auth-field-error"
              role="alert"
            >
              {passwordError}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="reset-confirm-password" className="auth-label">
            Confirmar nova senha
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            className={`auth-input${confirmPasswordError ? ' auth-input--error' : ''}`}
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
            aria-describedby={
              confirmPasswordError ? 'reset-confirm-error' : undefined
            }
            aria-invalid={confirmPasswordError ? 'true' : undefined}
          />
          {confirmPasswordError && (
            <span
              id="reset-confirm-error"
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
          {isSubmitting ? 'Atualizando…' : 'Atualizar senha'}
        </button>
      </form>
    </div>
  )
}
