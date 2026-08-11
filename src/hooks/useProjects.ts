import { useState, useEffect, useCallback, useRef } from 'react'
import type { Project } from '@lib/prisma'
import {
  createProject as apiCreateProject,
  getProjects,
  updateProject,
  deleteProject as apiDeleteProject,
  duplicateProject as apiDuplicateProject,
} from '../api/projects'
import { ApiError } from '../api/errors'
import { useAuth } from './useAuth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: ApiError | null
  createProject: (data: { name: string; folderId: string }) => Promise<Project>
  renameProject: (projectId: string, name: string) => Promise<Project>
  moveProject: (projectId: string, folderId: string) => Promise<Project>
  deleteProject: (projectId: string) => Promise<void>
  duplicateProject: (projectId: string) => Promise<Project>
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides CRUD operations for projects, with optimistic local state updates.
 *
 * - Fetches projects on mount (and whenever the authenticated user or
 *   `folderId` filter changes).
 * - After each mutation, updates local state immediately without re-fetching.
 * - Exposes `refresh()` for callers that need to force a re-fetch.
 * - `isLoading` is only `true` during the initial fetch (not during mutations).
 * - When the user is not authenticated, returns empty arrays and skips fetching.
 * - Accepts an optional `folderId` to filter projects by folder.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function useProjects(folderId?: string): UseProjectsReturn {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ApiError | null>(null)

  // -------------------------------------------------------------------------
  // Fetch helpers
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    if (!userId) {
      setProjects([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getProjects(userId, folderId)
      setProjects(data)
    } catch (err) {
      const apiErr =
        err instanceof ApiError
          ? err
          : new ApiError('SYSTEM.CONNECTION_ERROR', String(err), 500)
      setError(apiErr)
    } finally {
      setIsLoading(false)
    }
  }, [userId, folderId])

  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  })

  // Fetch on mount and whenever userId or folderId changes.
  useEffect(() => {
    void (async () => {
      await refreshRef.current()
    })()
  }, [userId, folderId])

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createProject = useCallback(
    async (data: { name: string; folderId: string }): Promise<Project> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const created = await apiCreateProject(userId, data)
        // Optimistic update: prepend the new project (newest first, matching server order).
        setProjects((prev) => [created, ...prev])
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

  const renameProject = useCallback(
    async (projectId: string, name: string): Promise<Project> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const updated = await updateProject(userId, projectId, { name })
        // Optimistic update: replace the renamed project in the array.
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updated : p)),
        )
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

  const moveProject = useCallback(
    async (projectId: string, folderId: string): Promise<Project> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const updated = await updateProject(userId, projectId, { folderId })
        // Optimistic update: replace the moved project in the array.
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updated : p)),
        )
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

  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        await apiDeleteProject(userId, projectId)
        // Optimistic update: remove the deleted project from the array.
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
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

  const duplicateProject = useCallback(
    async (projectId: string): Promise<Project> => {
      if (!userId) {
        throw new ApiError('AUTH.ACCESS_DENIED', 'Usuário não autenticado', 401)
      }

      try {
        const duplicated = await apiDuplicateProject(userId, projectId)
        // Optimistic update: prepend the duplicated project (newest first).
        setProjects((prev) => [duplicated, ...prev])
        return duplicated
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
    projects,
    isLoading,
    error,
    createProject,
    renameProject,
    moveProject,
    deleteProject,
    duplicateProject,
    refresh: refresh,
  }
}
