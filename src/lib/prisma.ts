import { fileURLToPath } from 'url'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { resolve, dirname } from 'node:path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname + '/../../.env') })

// Create a PostgreSQL connection pool using DATABASE_URL (session pool)
const connectionString = process.env['DATABASE_URL'] || ''

if (!connectionString) {
  throw Error('ConnectionString is Empty!')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Create Prisma client with the adapter
export const prisma = new PrismaClient({ adapter })

// Export types for convenience
export type { User, Folder, Project } from '@prisma/client'
