import Fastify from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import authPlugin from './plugins/auth.js'
import { folderRoutes } from './routes/folders.js'
import { projectRoutes } from './routes/projects.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = parseInt(process.env['PORT'] ?? '3001', 10)
const HOST = process.env['HOST'] ?? '0.0.0.0'
const ORIGIN = `${process.env['ORIGIN']}` || 'http://localhost:5173'

console.log(ORIGIN)

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    },
  })

  // Register CORS — allow the Vite dev server
  await fastify.register(cors, {
    origin: ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Register sensible (adds reply helpers like .notFound(), .badRequest(), etc.)
  await fastify.register(sensible)

  // Register authentication plugin (decorates fastify.authenticate)
  await fastify.register(authPlugin)

  // Register route handlers
  await fastify.register(folderRoutes)
  await fastify.register(projectRoutes)

  return fastify
}

async function start() {
  const fastify = await buildServer()

  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`Server listening on http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
