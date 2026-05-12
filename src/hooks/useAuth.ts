import { useContext } from 'react'
import { AuthContext } from '../components/auth/AuthContext'
import type { AuthContextValue } from '../types'

/**
 * Hook to access the authentication context.
 * Must be used inside an AuthProvider, otherwise throws an error.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
