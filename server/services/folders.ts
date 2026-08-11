import { prisma } from '../../src/lib/prisma.js'
import type { Folder } from '@prisma/client'
import { ApiError, ERROR_MESSAGES } from '../../src/api/errors.js'

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

async function validateFolderDepth(
  parentId: string | null,
  userId: string,
): Promise<boolean> {
  if (!parentId) return true

  let currentParentId: string | null = parentId
  let depth = 0

  while (currentParentId && depth < 5) {
    const folder = (await prisma.folder.findFirst({
      where: { id: currentParentId, userId },
      select: { parentId: true },
    })) as { parentId: string | null } | null
    currentParentId = folder?.parentId ?? null
    depth++
  }

  return depth < 5
}

async function wouldCreateCircularReference(
  folderId: string,
  destinationId: string,
  userId: string,
): Promise<boolean> {
  if (folderId === destinationId) return true

  let currentId: string | null = destinationId

  while (currentId) {
    const folder = (await prisma.folder.findFirst({
      where: { id: currentId, userId },
      select: { parentId: true },
    })) as { parentId: string | null } | null

    if (!folder) break

    if (folder.parentId === folderId) return true
    currentId = folder.parentId
  }

  return false
}

// ---------------------------------------------------------------------------
// Public service functions (used by Fastify route handlers)
// ---------------------------------------------------------------------------

export async function createFolder(
  userId: string,
  data: { name: string; parentId?: string | null },
): Promise<Folder> {
  const name = validateName(data.name)
  const parentId = data.parentId ?? null

  if (parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: parentId },
      select: { id: true, userId: true },
    })

    if (!parent) {
      throw new ApiError(
        'RESOURCE.NOT_FOUND',
        ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
        404,
      )
    }

    if (parent.userId !== userId) {
      throw new ApiError(
        'AUTH.ACCESS_DENIED',
        ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
        403,
      )
    }
  }

  const depthOk = await validateFolderDepth(parentId, userId)
  if (!depthOk) {
    throw new ApiError(
      'RESOURCE.FOLDER_DEPTH_EXCEEDED',
      ERROR_MESSAGES['RESOURCE.FOLDER_DEPTH_EXCEEDED'],
      400,
    )
  }

  return prisma.folder.create({
    data: { name, parentId, userId },
  })
}

export async function getFolders(userId: string): Promise<Folder[]> {
  return prisma.folder.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getFolder(
  userId: string,
  folderId: string,
): Promise<Folder> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
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

  return folder
}

export async function updateFolder(
  userId: string,
  folderId: string,
  data: { name?: string; parentId?: string | null },
): Promise<Folder> {
  const existing = await prisma.folder.findUnique({
    where: { id: folderId },
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

  const updateData: { name?: string; parentId?: string | null } = {}

  if (data.name !== undefined) {
    updateData.name = validateName(data.name)
  }

  if (data.parentId !== undefined) {
    const newParentId = data.parentId

    if (newParentId !== null) {
      const destination = await prisma.folder.findFirst({
        where: { id: newParentId },
        select: { id: true, userId: true },
      })

      if (!destination) {
        throw new ApiError(
          'RESOURCE.NOT_FOUND',
          ERROR_MESSAGES['RESOURCE.NOT_FOUND'],
          404,
        )
      }

      if (destination.userId !== userId) {
        throw new ApiError(
          'AUTH.ACCESS_DENIED',
          ERROR_MESSAGES['AUTH.ACCESS_DENIED'],
          403,
        )
      }

      const circular = await wouldCreateCircularReference(
        folderId,
        newParentId,
        userId,
      )
      if (circular) {
        throw new ApiError(
          'RESOURCE.CIRCULAR_REFERENCE',
          ERROR_MESSAGES['RESOURCE.CIRCULAR_REFERENCE'],
          400,
        )
      }

      const depthOk = await validateFolderDepth(newParentId, userId)
      if (!depthOk) {
        throw new ApiError(
          'RESOURCE.FOLDER_DEPTH_EXCEEDED',
          ERROR_MESSAGES['RESOURCE.FOLDER_DEPTH_EXCEEDED'],
          400,
        )
      }
    }

    updateData.parentId = newParentId
  }

  return prisma.folder.update({
    where: { id: folderId },
    data: updateData,
  })
}

export async function deleteFolder(
  userId: string,
  folderId: string,
): Promise<void> {
  const existing = await prisma.folder.findUnique({
    where: { id: folderId },
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

  await prisma.folder.delete({
    where: { id: folderId },
  })
}
