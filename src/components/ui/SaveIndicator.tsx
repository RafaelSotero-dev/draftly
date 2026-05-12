import { useEffect, useState } from 'react'
import { Spinner } from './Spinner'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface SaveIndicatorProps {
  state: SaveState
}

export function SaveIndicator({ state }: SaveIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (state === 'idle') {
      setVisible(false)
      return
    }

    setVisible(true)

    if (state === 'saved') {
      const timer = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(timer)
    }

    return undefined
  }, [state])

  if (!visible) return null

  return (
    <div
      className={`ui-save-indicator ui-save-indicator--${state}`}
      aria-live="polite"
    >
      {state === 'saving' && (
        <>
          <Spinner size="sm" label="Salvando" />
          <span>Salvando...</span>
        </>
      )}
      {state === 'saved' && (
        <>
          <span className="ui-save-indicator__icon" aria-hidden="true">
            ✓
          </span>
          <span>Salvo</span>
        </>
      )}
      {state === 'error' && (
        <>
          <span className="ui-save-indicator__icon" aria-hidden="true">
            ⚠
          </span>
          <span>Erro ao salvar</span>
        </>
      )}
    </div>
  )
}

export type { SaveState }
