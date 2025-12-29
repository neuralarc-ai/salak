"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthToken } from "@/lib/api-client"
import { useAuth } from "@/components/auth-context"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const authCheckPerformed = useRef(false)

  useEffect(() => {
    // Only perform auth check once per browser session
    // Use both useRef for component lifecycle and sessionStorage for browser session
    const sessionAuthChecked = typeof window !== 'undefined' &&
      sessionStorage.getItem('auth_checked') === 'true'

    if (!authCheckPerformed.current && !sessionAuthChecked) {
      authCheckPerformed.current = true
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_checked', 'true')
      }
      checkAuth()
    } else if (sessionAuthChecked) {
      // Auth was already checked in this session, assume authenticated
      console.log('AuthGuard: Auth already checked this session, skipping check')
      setLoading(false)
      setAuthenticated(true)
    }
  }, [])

  const checkAuth = async () => {
    try {
      console.log('AuthGuard: Checking JWT authentication (once per component)...')

      // Get JWT token from localStorage or Supabase session
      const token = await getAuthToken()

      if (!token) {
        console.log('AuthGuard: No JWT token found, redirecting to login')
        setLoading(false)
        router.push("/login")
        return
      }

      console.log('AuthGuard: JWT token found, validating with backend')

      // Validate token with backend - this call happens only once
      const response = await fetch("/api/auth/me", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.log('AuthGuard: Token validation failed, redirecting to login')
        // Clear invalid token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('token')
          localStorage.removeItem('jwt_token')
          // Clear session auth check flag so it can be re-checked on next attempt
          sessionStorage.removeItem('auth_checked')
        }
        setLoading(false)
        router.push("/login")
        return
      }

      const userData = await response.json()
      console.log('AuthGuard: JWT authentication successful for user:', userData.user?.email)

      // Update AuthContext with authenticated user
      if (userData.user) {
        login(userData.user)
      }

      setAuthenticated(true)
    } catch (error) {
      console.error('AuthGuard: Auth check error:', error)
      // Clear potentially corrupted tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
        localStorage.removeItem('jwt_token')
        // Clear session auth check flag so it can be re-checked on next attempt
        sessionStorage.removeItem('auth_checked')
      }
      setLoading(false)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Verifying Authentication</h2>
            <p className="text-muted-foreground">Please wait while we validate your token...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}

