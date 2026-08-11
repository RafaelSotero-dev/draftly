import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { validateToken } from '../lib/auth-middleware.js'
import { prisma } from '../../src/lib/prisma.js'
import type { User } from '@supabase/supabase-js'

// Extend FastifyRequest to include the authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    user: User
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader = request.headers['authorization']
        const user = await validateToken(authHeader)
        request.user = user

        // Ensure the user exists in our PostgreSQL users table.
        // Supabase Auth manages authentication, but our DB needs a matching row
        // for foreign key constraints on folders and projects.
        await prisma.user.upsert({
          where: { id: user.id },
          update: { email: user.email ?? '' },
          create: {
            id: user.id,
            email: user.email ?? '',
          },
        })
      } catch (err: unknown) {
        const error = err as {
          code?: string
          message?: string
          status?: number
        }
        return reply.status(error.status ?? 401).send({
          code: error.code ?? 'AUTH.INVALID_TOKEN',
          message: error.message ?? 'Token de autenticação inválido',
          status: error.status ?? 401,
        })
      }
    },
  )
}

export default fp(authPlugin)
