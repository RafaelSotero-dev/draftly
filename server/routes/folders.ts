import type { FastifyInstance, FastifyReply } from 'fastify'
import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
} from '../services/folders.js'
import { ApiError } from '../../src/api/errors.js'

export async function folderRoutes(fastify: FastifyInstance) {
  // POST /api/folders — Create a new folder
  fastify.post(
    '/api/folders',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const body = request.body as { name?: string; parentId?: string | null }
      try {
        const folder = await createFolder(userId, {
          name: body.name ?? '',
          parentId: body.parentId,
        })
        return reply.status(201).send(folder)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/folders — List all folders for the authenticated user
  fastify.get(
    '/api/folders',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      try {
        const folders = await getFolders(userId)
        return reply.send(folders)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/folders/:id — Get a single folder
  fastify.get(
    '/api/folders/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      try {
        const folder = await getFolder(userId, id)
        return reply.send(folder)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // PATCH /api/folders/:id — Rename or move a folder
  fastify.patch(
    '/api/folders/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      const body = request.body as { name?: string; parentId?: string | null }
      try {
        const folder = await updateFolder(userId, id, {
          name: body.name,
          parentId: body.parentId,
        })
        return reply.send(folder)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // DELETE /api/folders/:id — Delete a folder (cascade)
  fastify.delete(
    '/api/folders/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      try {
        await deleteFolder(userId, id)
        return reply.status(204).send()
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )
}

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof ApiError) {
    return reply.status(err.status).send({
      code: err.code,
      message: err.message,
      status: err.status,
    })
  }
  return reply.status(500).send({
    code: 'SYSTEM.INTERNAL_ERROR',
    message: 'Erro interno do servidor',
    status: 500,
  })
}
