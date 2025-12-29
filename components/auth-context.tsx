"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthenticatedUser } from '@/lib/auth-helpers'
import { getAuthToken } from '@/lib/api-client'

interface AuthState {
  user: AuthenticatedUser | null
  loading: boolean
  authenticated: boolean
}

interface AuthContextType extends AuthState {
  checkAuth: () => Promise<void>
  login: (user: AuthenticatedUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false, // Start as not loading since AuthGuard handles initial auth check
    authenticated: false,
  })

  const checkAuth = async () => {
    try {
      console.log('AuthContext: Checking authentication...')

      // Get JWT token from localStorage or Supabase session
      const token = await getAuthToken()

      if (!token) {
        console.log('AuthContext: No JWT token found')
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
        return
      }

      console.log('AuthContext: JWT token found, validating with backend')

      // Validate token with backend
      const response = await fetch("/api/auth/me", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log('AuthContext: Token validation failed')
        // Clear invalid token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('token')
          localStorage.removeItem('jwt_token')
        }
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
        })
        return
      }

      const userData = await response.json()
      console.log('AuthContext: Authentication successful for user:', userData.user?.email)
      setAuthState({
        user: userData.user,
        loading: false,
        authenticated: true,
      })
    } catch (error) {
      console.error('AuthContext: Auth check error:', error)
      // Clear potentially corrupted tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
        localStorage.removeItem('jwt_token')
      }
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
      })
    }
  }

  const login = (user: AuthenticatedUser) => {
    console.log('AuthContext: User logged in:', user.email)
    setAuthState({
      user,
      loading: false,
      authenticated: true,
    })
  }

  const logout = async () => {
    console.log('AuthContext: User logged out')

    try {
      // Call logout API to clear httpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('AuthContext: Error during logout API call:', error)
    }

    // Clear tokens from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('jwt_token')
      // Clear session auth check flag so next login will re-check auth
      sessionStorage.removeItem('auth_checked')
    }

    setAuthState({
      user: null,
      loading: false,
      authenticated: false,
    })
  }

  // AuthContext no longer automatically checks auth on load - AuthGuard handles this

  const value: AuthContextType = {
    ...authState,
    checkAuth,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
