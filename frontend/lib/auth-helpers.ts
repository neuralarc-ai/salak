import { NextRequest } from 'next/server'
import { createServerClient } from './supabase'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

/**
 * Get authenticated user from request headers
 * Expects user info in Authorization header as JSON string
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return null
    }

    // Parse user from Authorization header
    // Format: "Bearer {JSON.stringify(user)}"
    const token = authHeader.replace('Bearer ', '')
    const user = JSON.parse(token) as AuthenticatedUser

    // Verify user exists in database
    const supabase = createServerClient()
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', user.id)
      .single()

    if (error || !dbUser) {
      return null
    }

    return dbUser as AuthenticatedUser
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin'
}

/**
 * Log system action
 */
export async function logAction(
  userId: string | null,
  action: string,
  resource: string | null,
  status: 'success' | 'failed',
  ipAddress: string | null = null
): Promise<void> {
  try {
    const supabase = createServerClient()
    await supabase.from('system_logs').insert({
      user_id: userId,
      action,
      resource,
      status,
      ip_address: ipAddress,
    })
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || null
}

