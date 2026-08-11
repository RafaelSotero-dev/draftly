import { forwardRef } from 'react'
import type React from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
  size?: 'sm' | 'md'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      isLoading = false,
      size = 'md',
      children,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) {
    const classes = [
      'ui-btn',
      `ui-btn--${variant}`,
      `ui-btn--${size}`,
      isLoading ? 'ui-btn--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled ?? isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        {...props}
      >
        {isLoading && <Spinner size="sm" label="Carregando" />}
        <span className={isLoading ? 'ui-btn__label--hidden' : undefined}>
          {children}
        </span>
      </button>
    )
  },
)
