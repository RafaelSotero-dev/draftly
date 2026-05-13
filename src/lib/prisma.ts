import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import dotenv from 'dotenv'

dotenv.config()

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
