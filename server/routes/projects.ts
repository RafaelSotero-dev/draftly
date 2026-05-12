import type { FastifyInstance, FastifyReply } from 'fastify'
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  duplicateProject,
  saveCanvas,
  saveThumbnail,
} from '../services/projects.js'
import { ApiError } from '../../src/api/errors.js'

export async function projectRoutes(fastify: FastifyInstance) {
  // POST /api/projects — Create a new project
  fastify.post(
    '/api/projects',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const body = request.body as { name?: string; folderId?: string }
      try {
        const project = await createProject(userId, {
          name: body.name ?? '',
          folderId: body.folderId ?? '',
        })
        return reply.status(201).send(project)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/projects — List all projects for the authenticated user
  fastify.get(
    '/api/projects',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const query = request.query as { folderId?: string }
      try {
        const projects = await getProjects(userId, query.folderId)
        return reply.send(projects)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // GET /api/projects/:id — Get a single project
  fastify.get(
    '/api/projects/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      try {
        const project = await getProject(userId, id)
        return reply.send(project)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // PATCH /api/projects/:id — Rename or move a project
  fastify.patch(
    '/api/projects/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      const body = request.body as { name?: string; folderId?: string }
      try {
        const project = await updateProject(userId, id, {
          name: body.name,
          folderId: body.folderId,
        })
        return reply.send(project)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // DELETE /api/projects/:id — Delete a project
  fastify.delete(
    '/api/projects/:id',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      try {
        await deleteProject(userId, id)
        return reply.status(204).send()
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/projects/:id/duplicate — Duplicate a project
  fastify.post(
    '/api/projects/:id/duplicate',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      try {
        const project = await duplicateProject(userId, id)
        return reply.status(201).send(project)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/projects/:id/save — Save canvas data
  fastify.post(
    '/api/projects/:id/save',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      const body = request.body as { canvasData?: unknown }
      try {
        const project = await saveCanvas(userId, id, body.canvasData)
        return reply.send(project)
      } catch (err) {
        return handleError(err, reply)
      }
    },
  )

  // POST /api/projects/:id/thumbnail — Upload thumbnail (Base64 PNG)
  fastify.post(
    '/api/projects/:id/thumbnail',
    { preHandler: fastify.authenticate },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as { id: string }
      const body = request.body as { thumbnail?: string }
      try {
        const project = await saveThumbnail(userId, id, body.thumbnail ?? '')
        return reply.send(project)
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
