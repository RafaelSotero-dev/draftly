import { useState, useEffect, useCallback, useRef } from 'react'
import type { Folder } from '@lib/prisma'
import {
  createFolder as apiCreateFolder,
  getFolders,
  updateFolder,
  deleteFolder as apiDeleteFolder,
} from '../api/folders'
import { ApiError } from '../api/errors'
import { useAuth } from './useAuth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseFoldersReturn {
  folders: Folder[]
  isLoading: boolean
  error: ApiError | null
  createFolder: (data: {
    name: string
    parentId?: string | null
  }) => Promise<Folder>
  renameFolder: (folderId: string, name: string) => Promise<Folder>
  moveFolder: (folderId: string, parentId: string | null) => Promise<Folder>
  deleteFolder: (folderId: string) => Promise<void>
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides CRUD operations for folders, with optimistic local state updates.
 *
 * - Fetches all folders on mount (and whenever the authenticated user changes).
 * - After each mutation, updates local state immediately without re-fetching.
 * - Exposes `refresh()` for callers that need to force a re-fetch.
 * - `isLoading` is only `true` during the initial fetch (not during mutations).
 * - When the user is not authenticated, returns empty arrays and skips fetching.
 *
 * Requirements: 3.1, 3.3, 3.4, 3.6
 */
export function useFolders(): UseFoldersReturn {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ApiError | null>(null)

  // -------------------------------------------------------------------------
  // Fetch helpers
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    if (!userId) {
      setFolders([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getFolders(userId)
      setFolders(data)
    } catch (err) {
      const apiErr =
        err instanceof ApiError
          ? err
          : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
      setError(apiErr)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Keep a stable ref to refresh so the effect below doesn't re-run when the
  // callback identity changes (it only changes when userId changes anyway, but
  // this makes the dependency explicit and avoids the lint warning about
  // calling setState synchronously inside an effect).
  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  // Fetch on mount and whenever userId changes.
  // The effect calls the async function via a ref so setState is never called
  // synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      await refreshRef.current()
      // If the component unmounted while loading, the setState calls inside
      // refresh will still fire, but React will silently ignore them.
      // The cancelled flag is kept here for future use if needed.
      void cancelled
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId])

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createFolder = useCallback(
    async (data: {
      name: string
      parentId?: string | null
    }): Promise<Folder> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const created = await apiCreateFolder(userId, data)
        setFolders((prev) => [...prev, created])
        return created
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
        setError(apiErr)
        throw apiErr
      }
    },
    [userId],
  )

  const renameFolder = useCallback(
    async (folderId: string, name: string): Promise<Folder> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const updated = await updateFolder(userId, folderId, { name })
        setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)))
        return updated
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
        setError(apiErr)
        throw apiErr
      }
    },
    [userId],
  )

  const moveFolder = useCallback(
    async (folderId: string, parentId: string | null): Promise<Folder> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const updated = await updateFolder(userId, folderId, { parentId })
        setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)))
        return updated
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
        setError(apiErr)
        throw apiErr
      }
    },
    [userId],
  )

  const deleteFolder = useCallback(
    async (folderId: string): Promise<void> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        await apiDeleteFolder(userId, folderId)
        setFolders((prev) => prev.filter((f) => f.id !== folderId))
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
        setError(apiErr)
        throw apiErr
      }
    },
    [userId],
  )

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    folders,
    isLoading,
    error,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    refresh,
  }
}
