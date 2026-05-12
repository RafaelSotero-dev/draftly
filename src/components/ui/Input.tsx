import type React from 'react'
import { useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  id: idProp,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined

  const inputClasses = ['ui-input', error ? 'ui-input--error' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="ui-input-field">
      {label && (
        <label htmlFor={id} className="ui-input-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={inputClasses}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error && (
        <span id={errorId} className="ui-input-error" role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="ui-input-hint">
          {hint}
        </span>
      )}
    </div>
  )
}
