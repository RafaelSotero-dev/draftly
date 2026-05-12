import type { Project } from '@prisma/client'
import { apiClient } from '@lib/api'

// Re-export the Project type for consumers that import it from here
export type { Project }

/**
 * Creates a new project with an empty canvas for the authenticated user.
 *
 * Requirements: 5.1, 10.6
 */
export async function createProject(
  _userId: string,
  data: { name: string; folderId: string },
): Promise<Project> {
  return apiClient.post<Project>('/api/projects', data)
}

/**
 * Returns all projects belonging to the authenticated user, optionally
 * filtered by folder.
 *
 * Requirements: 10.1, 10.7
 */
export async function getProjects(
  _userId: string,
  folderId?: string,
): Promise<Project[]> {
  const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''
  return apiClient.get<Project[]>(`/api/projects${query}`)
}

/**
 * Returns a single project by ID.
 *
 * Requirements: 10.2, 10.3
 */
export async function getProject(
  _userId: string,
  projectId: string,
): Promise<Project> {
  return apiClient.get<Project>(`/api/projects/${projectId}`)
}

/**
 * Renames and/or moves a project to a different folder.
 *
 * Requirements: 5.2, 5.5
 */
export async function updateProject(
  _userId: string,
  projectId: string,
  data: { name?: string; folderId?: string },
): Promise<Project> {
  return apiClient.patch<Project>(`/api/projects/${projectId}`, data)
}

/**
 * Deletes a project permanently.
 *
 * Requirements: 5.4
 */
export async function deleteProject(
  _userId: string,
  projectId: string,
): Promise<void> {
  return apiClient.delete(`/api/projects/${projectId}`)
}

/**
 * Duplicates a project — creates a copy with a new UUID, name suffixed with
 * " (cópia)", and the same canvasData, thumbnail, and folderId.
 *
 * Requirements: 5.3
 */
export async function duplicateProject(
  _userId: string,
  projectId: string,
): Promise<Project> {
  return apiClient.post<Project>(`/api/projects/${projectId}/duplicate`)
}

/**
 * Saves canvas data for a project, updating canvasData and the updatedAt
 * timestamp.
 *
 * Requirements: 6.2, 6.4
 */
export async function saveCanvas(
  _userId: string,
  projectId: string,
  canvasData: unknown,
): Promise<Project> {
  return apiClient.post<Project>(`/api/projects/${projectId}/save`, {
    canvasData,
  })
}

/**
 * Uploads a Base64 PNG thumbnail for a project.
 *
 * Requirements: 4.2
 */
export async function uploadThumbnail(
  _userId: string,
  projectId: string,
  thumbnail: string,
): Promise<Project> {
  return apiClient.post<Project>(`/api/projects/${projectId}/thumbnail`, {
    thumbnail,
  })
}
