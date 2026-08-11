import { prisma } from '../../src/lib/prisma.js'
import type { Project } from '@prisma/client'
import { ApiError, ERROR_MESSAGES } from '../../src/api/errors.js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_CANVAS_DATA = {
  type: 'excalidraw',
  version: 2,
  elements: [],
  appState: { viewBackgroundColor: '#ffffff' },
  files: {},
} as const

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    throw new ApiError(
      'VALIDATION.EMPTY_NAME',
      ERROR_MESSAGES['VALIDATION.EMPTY_NAME'],
      400,
    )
  }
  if (trimmed.length > 255) {
    throw new ApiError(
      'VALIDATION.NAME_TOO_LONG',
      ERROR_MESSAGES['VALIDATION.NAME_TOO_LONG'],
      400,
    )
  }
  return trimmed
}

async function validateFolderOwnership(
  folderId: string,
  userId: string,
): Promise<void> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, userId: true },
  })

  if (!folder) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (folder.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }
}

// ---------------------------------------------------------------------------
// Public service functions (used by Fastify route handlers)
// ---------------------------------------------------------------------------

export async function createProject(
  userId: string,
  data: { name: string; folderId: string },
): Promise<Project> {
  const name = validateName(data.name)
  await validateFolderOwnership(data.folderId, userId)

  return prisma.project.create({
    data: {
      name,
      folderId: data.folderId,
      userId,
      canvasData: EMPTY_CANVAS_DATA,
    },
  })
}

export async function getProjects(
  userId: string,
  folderId?: string,
): Promise<Project[]> {
  return prisma.project.findMany({
    where: {
      userId,
      ...(folderId !== undefined ? { folderId } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getProject(
  userId: string,
  projectId: string,
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (project.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  return project
}

export async function updateProject(
  userId: string,
  projectId: string,
  data: { name?: string; folderId?: string },
): Promise<Project> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!existing) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  const updateData: { name?: string; folderId?: string } = {}

  if (data.name !== undefined) {
    updateData.name = validateName(data.name)
  }

  if (data.folderId !== undefined) {
    await validateFolderOwnership(data.folderId, userId)
    updateData.folderId = data.folderId
  }

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
  })
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<void> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!existing) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  await prisma.project.delete({
    where: { id: projectId },
  })
}

export async function duplicateProject(
  userId: string,
  projectId: string,
): Promise<Project> {
  const original = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!original) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (original.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  return prisma.project.create({
    data: {
      name: `${original.name} (cópia)`,
      canvasData: original.canvasData as object,
      thumbnail: original.thumbnail,
      folderId: original.folderId,
      userId,
    },
  })
}

export async function saveCanvas(
  userId: string,
  projectId: string,
  canvasData: unknown,
): Promise<Project> {
  if (
    canvasData === null ||
    typeof canvasData !== 'object' ||
    Array.isArray(canvasData)
  ) {
    throw new ApiError(
      'VALIDATION.INVALID_CANVAS_DATA',
      ERROR_MESSAGES['VALIDATION.INVALID_CANVAS_DATA'],
      400,
    )
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!existing) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { canvasData: canvasData as object },
  })
}

export async function saveThumbnail(
  userId: string,
  projectId: string,
  thumbnail: string,
): Promise<Project> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!existing) {
    throw new ApiError(
      'RESOURCE.NOT_FOUND',
      ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
      404,
    )
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      'AUTH.ACCESS_DENIED',
      ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
      403,
    )
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { thumbnail },
  })
}
