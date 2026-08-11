interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function Spinner({ size = 'md', label = 'Carregando' }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ui-spinner--${size}`}
      role="status"
      aria-label={label}
    />
  )
}
