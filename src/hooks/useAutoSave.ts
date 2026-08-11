import { useState, useRef, useCallback, useEffect } from 'react'
import type { SaveState } from '@components/ui/SaveIndicator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseAutoSaveOptions {
  /** Debounce delay in ms. Default: 2000 */
  delay?: number
  /** Retry interval in ms when a save fails. Default: 10000 */
  retryDelay?: number
  /** localStorage key for backup. When provided, failed saves are persisted locally. */
  localStorageKey?: string
  onSave: (data: unknown) => Promise<void>
  onError?: (error: Error) => void
}

interface UseAutoSaveReturn {
  save: (data: unknown) => void
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
  saveState: SaveState
  /** True when there is unsaved data in localStorage (pending sync) */
  hasPendingLocalData: boolean
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function writeLocalBackup(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors
  }
}

function clearLocalBackup(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
}

function hasLocalBackup(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Debounced auto-save hook with localStorage backup and automatic retry.
 *
 * - `save(data)` debounces saves by `delay` ms (default 2s). Requirement 6.1, 6.3
 * - On failure, data is written to localStorage and a retry is scheduled
 *   every `retryDelay` ms (default 10s). Requirement 6.5
 * - On success, the localStorage backup is cleared.
 * - `saveState` drives the `SaveIndicator` component.
 */
export function useAutoSave({
  delay = 2000,
  retryDelay = 10000,
  localStorageKey,
  onSave,
  onError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [hasPendingLocalData, setHasPendingLocalData] = useState(
    localStorageKey ? hasLocalBackup(localStorageKey) : false,
  )

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<unknown>(null)
  const onSaveRef = useRef(onSave)
  const onErrorRef = useRef(onError)

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onSaveRef.current = onSave
  })
  useEffect(() => {
    onErrorRef.current = onError
  })

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null)
        clearTimeout(debounceTimerRef.current)
      if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Core save executor (shared by debounce and retry)
  // ---------------------------------------------------------------------------

  const executeSave = useCallback(
    (snapshot: unknown) => {
      // Cancel any pending retry before attempting
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }

      setIsSaving(true)
      setError(null)

      onSaveRef
        .current(snapshot)
        .then(() => {
          setLastSaved(new Date())
          setError(null)
          // Clear local backup on success
          if (localStorageKey) {
            clearLocalBackup(localStorageKey)
            setHasPendingLocalData(false)
          }
        })
        .catch((err: unknown) => {
          const e = err instanceof Error ? err : new Error(String(err))
          setError(e)
          onErrorRef.current?.(e)

          // Persist data locally so it's not lost
          if (localStorageKey) {
            writeLocalBackup(localStorageKey, snapshot)
            setHasPendingLocalData(true)
          }

          // Schedule automatic retry
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null
            executeSave(dataRef.current)
          }, retryDelay)
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localStorageKey, retryDelay],
  )

  // ---------------------------------------------------------------------------
  // Public save — debounced entry point
  // ---------------------------------------------------------------------------

  const save = useCallback(
    (data: unknown) => {
      dataRef.current = data

      // Cancel any pending debounce timer
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }

      // Schedule a new debounced save
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        executeSave(dataRef.current)
      }, delay)
    },
    [delay, executeSave],
  )

  // ---------------------------------------------------------------------------
  // Derive saveState
  // ---------------------------------------------------------------------------

  let saveState: SaveState = 'idle'
  if (isSaving) {
    saveState = 'saving'
  } else if (error) {
    saveState = 'error'
  } else if (lastSaved) {
    saveState = 'saved'
  }

  return { save, isSaving, lastSaved, error, saveState, hasPendingLocalData }
}
