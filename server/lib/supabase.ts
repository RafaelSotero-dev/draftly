import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'node:path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname + '/../../.env') })

const supabaseUrl = process.env['VITE_SUPABASE_URL'] ?? ''
const supabaseAnonKey = process.env['VITE_SUPABASE_ANON_KEY'] ?? ''

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
