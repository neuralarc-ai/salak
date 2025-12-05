"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const user = getCurrentUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Verify user is still valid
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${JSON.stringify(user)}`,
        },
      })

      if (!response.ok) {
        localStorage.removeItem("user")
        localStorage.removeItem("isAuthenticated")
        router.push("/login")
        return
      }

      setAuthenticated(true)
    } catch (error) {
      localStorage.removeItem("user")
      localStorage.removeItem("isAuthenticated")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}

