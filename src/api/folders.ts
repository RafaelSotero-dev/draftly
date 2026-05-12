import type { Folder } from '@prisma/client'
import { apiClient } from '@lib/api'

// Re-export the Folder type for consumers that import it from here
export type { Folder }

/**
 * Creates a new folder for the authenticated user.
 *
 * Requirements: 3.1, 10.5
 */
export async function createFolder(
  _userId: string,
  data: { name: string; parentId?: string | null },
): Promise<Folder> {
  return apiClient.post<Folder>('/api/folders', data)
}

/**
 * Returns all folders belonging to the authenticated user.
 *
 * Requirements: 3.1, 10.1, 10.7
 */
export async function getFolders(_userId: string): Promise<Folder[]> {
  return apiClient.get<Folder[]>('/api/folders')
}

/**
 * Returns a single folder by ID.
 *
 * Requirements: 10.2, 10.3
 */
export async function getFolder(
  _userId: string,
  folderId: string,
): Promise<Folder> {
  return apiClient.get<Folder>(`/api/folders/${folderId}`)
}

/**
 * Updates a folder's name and/or parent (move operation).
 *
 * Requirements: 3.3, 3.5, 3.6
 */
export async function updateFolder(
  _userId: string,
  folderId: string,
  data: { name?: string; parentId?: string | null },
): Promise<Folder> {
  return apiClient.patch<Folder>(`/api/folders/${folderId}`, data)
}

/**
 * Deletes a folder. Cascade deletion of children and projects is handled
 * server-side by the Prisma schema's onDelete: Cascade constraint.
 *
 * Requirements: 3.4, 10.8
 */
export async function deleteFolder(
  _userId: string,
  folderId: string,
): Promise<void> {
  return apiClient.delete(`/api/folders/${folderId}`)
}
