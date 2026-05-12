import type { User, Session } from '@supabase/supabase-js'

// Re-export Supabase types for convenience
export type { User, Session }

// Auth context value interface
export interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
