import { NextRequest } from 'next/server'
import { createServerClient } from './supabase'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

/**
 * Create a Supabase client for token validation
 * Uses anon key for validating user tokens (service role key bypasses auth checks)
 */
function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for auth')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Get authenticated user from JWT token in Authorization header or httpOnly cookie
 * Tries Supabase session token validation first (for Supabase Auth tokens),
 * then falls back to custom JWT verification (for JWTs signed with JWT_SECRET)
 * This supports both Supabase Auth tokens and custom JWTs
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    let token: string | null = null

    // First, try to get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim()
    }

    // If no token in header, try to get from httpOnly cookie (for iframe authentication)
    if (!token) {
      // Try both cookie names for compatibility
      const accessTokenCookie = request.cookies.get('accessToken')?.value
      const tokenCookie = request.cookies.get('token')?.value

      if (accessTokenCookie) {
        token = accessTokenCookie
        console.log('[Auth] Using accessToken from httpOnly cookie for iframe authentication')
      } else if (tokenCookie) {
        token = tokenCookie
        console.log('[Auth] Using token from httpOnly cookie for iframe authentication')
      }
    }

    if (!token || token.length < 20) {
      console.error('[Auth] Missing or invalid token (checked both header and cookie)')
      return null
    }
    
    if (!token || token.length < 20) {
      console.error('[Auth] Invalid token format (too short)')
      return null
    }

    // First, try Supabase session token validation (for Supabase Auth tokens)
    // Use anon key client for token validation (service role bypasses auth)
    try {
      console.log('[Auth] Attempting Supabase token validation...')
      const authClient = createAuthClient()
      const { data: { user: supabaseUser }, error: supabaseError } = await authClient.auth.getUser(token)

      if (supabaseError) {
        console.log('[Auth] Supabase token validation error:', supabaseError.message)
      }

      if (!supabaseError && supabaseUser) {
        console.log('[Auth] Supabase token validated successfully for user:', supabaseUser.email)
        
        // Token is a valid Supabase token, get user profile using server client
        // Match strictly by auth user id (UUID), not by email
        const supabase = createServerClient()
        let { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', supabaseUser.id)
          .maybeSingle()

        // If not found by UUID, try by email as fallback
        if (!dbUser && !dbError && supabaseUser.email) {
          console.log('[Auth] User not found by UUID, trying by email:', supabaseUser.email)
          const { data: emailUser, error: emailError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('email', supabaseUser.email)
            .maybeSingle()
          
          if (!emailError && emailUser) {
            console.log('[Auth] User found by email')
            dbUser = emailUser
            dbError = null
          }
        }

        if (!dbError && dbUser) {
          console.log('[Auth] User profile retrieved successfully')
          return dbUser as AuthenticatedUser
        }
        
        // User profile not found - try to create it from auth.users data
        // Only create if no row is found (dbUser is null)
        if (!dbUser) {
          console.log('[Auth] User profile not found, attempting to create from auth.users')
          const createdUser = await ensureUserProfileExists(
            supabaseUser.id,
            supabaseUser.email,
            supabaseUser.user_metadata
          )
          
          if (createdUser) {
            return createdUser
          }
        }
        
        if (dbError) {
          console.error('[Auth] Error retrieving user from database:', dbError.message, 'User ID:', supabaseUser.id)
        }
      } else if (supabaseError) {
        console.error('[Auth] Supabase token validation failed:', supabaseError.message, supabaseError.status)
      }
    } catch (supabaseAuthError) {
      console.error('[Auth] Supabase auth client error:', supabaseAuthError)
    }

    // Fallback: Try custom JWT verification (for custom JWTs signed with JWT_SECRET)
    // This maintains backward compatibility for custom tokens
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload
        const userId = decoded.sub || decoded.user_id || decoded.id

        if (userId) {
          console.log('[Auth] Custom JWT validated successfully for user ID:', userId)
          const supabase = createServerClient()
          const { data: dbUser, error } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('id', userId)
            .maybeSingle()

          if (!error && dbUser) {
            console.log('[Auth] User profile retrieved from custom JWT')
            return dbUser as AuthenticatedUser
          }
        }
      } catch (jwtError) {
        // JWT verification failed - this is expected if it's a Supabase token
        if (jwtError instanceof jwt.JsonWebTokenError) {
          console.error('[Auth] Custom JWT verification failed:', jwtError.message)
        }
      }
    } else {
      console.warn('[Auth] JWT_SECRET not configured - custom JWT verification disabled')
    }

    // If both methods failed, return null
    console.error('[Auth] All authentication methods failed')
    return null
  } catch (error) {
    console.error('[Auth] Unexpected auth error:', error)
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
 * Get authenticated user from Supabase session token
 * This validates the JWT token from Authorization header
 * Uses anon key for token validation (service role bypasses auth checks)
 */
export async function getAuthenticatedUserFromSession(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '').trim()

    // Verify token with Supabase using anon key (for proper token validation)
    const authClient = createAuthClient()
    const { data: { user }, error } = await authClient.auth.getUser(token)

    if (error || !user) {
      console.error('[Session Auth] Token validation failed:', error?.message)
      return null
    }

    // Get user profile from database using server client (for RLS bypass)
    // Match strictly by auth user id (UUID), not by email
    const supabase = createServerClient()
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!dbError && dbUser) {
      return dbUser as AuthenticatedUser
    }

    // User profile not found - try to create it from auth.users data
    // Only create if no row is found (dbUser is null)
    if (!dbUser) {
      console.log('[Session Auth] User profile not found, attempting to create from auth.users')
      const createdUser = await ensureUserProfileExists(
        user.id,
        user.email,
        user.user_metadata
      )
      
      if (createdUser) {
        return createdUser
      }
    }

    if (dbError) {
      console.error('[Session Auth] Error retrieving user profile:', dbError.message)
    }
    return null
  } catch (error) {
    console.error('[Session Auth] Unexpected error:', error)
    return null
  }
}

/**
 * Ensure user profile exists in public.users table
 * Creates the profile if it doesn't exist, using data from auth.users
 * Matches users strictly by auth user id (UUID), not by email
 * Only creates if no row is found - does not attempt insert if user already exists
 * Returns the user profile or null if creation fails
 */
async function ensureUserProfileExists(
  authUserId: string,
  authUserEmail: string | undefined,
  authUserMetadata: Record<string, any> | undefined
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createServerClient()

    // Check if user already exists - match strictly by auth user id (UUID)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authUserId)
      .maybeSingle()

    // If user exists, return it immediately
    if (!checkError && existingUser) {
      return existingUser as AuthenticatedUser
    }

    // Only create if no row is found (existingUser is null)
    // Do not attempt to insert if user already exists
    if (existingUser) {
      console.log('[Auth] User profile already exists, skipping creation')
      return null
    }

    // User doesn't exist, create it
    console.log('[Auth] User profile not found, creating from auth.users data:', authUserId)
    
    const userName = authUserMetadata?.full_name || 
                     authUserMetadata?.name || 
                     authUserEmail?.split('@')[0] || 
                     'User'
    
    const userRole = authUserMetadata?.role || 'user'

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: authUserEmail || '',
        name: userName,
        role: userRole,
      })
      .select('id, email, name, role')
      .maybeSingle()

    if (createError) {
      // Handle duplicate key errors (user was created between check and insert)
      if (createError.code === '23505') {
        // User was created by another process (trigger or concurrent request), fetch it
        console.log('[Auth] User profile was created concurrently, fetching existing record')
        const { data: fetchedUser, error: fetchError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', authUserId)
          .maybeSingle()
        
        if (!fetchError && fetchedUser) {
          return fetchedUser as AuthenticatedUser
        }
      }
      
      // Handle duplicate email errors gracefully (shouldn't happen with UUID matching, but handle it)
      if (createError.code === '23505' && createError.message?.includes('email')) {
        console.warn('[Auth] Duplicate email detected, but user lookup by UUID should prevent this')
        // Try to fetch by UUID instead
        const { data: fetchedUser, error: fetchError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', authUserId)
          .maybeSingle()
        
        if (!fetchError && fetchedUser) {
          return fetchedUser as AuthenticatedUser
        }
      }
      
      console.error('[Auth] Failed to create user profile:', createError.message, 'Code:', createError.code)
      return null
    }

    if (newUser) {
      console.log('[Auth] User profile created successfully:', newUser.email)
      return newUser as AuthenticatedUser
    }

    // If insert succeeded but no data returned, try fetching
    const { data: fetchedUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authUserId)
      .maybeSingle()

    if (!fetchError && fetchedUser) {
      return fetchedUser as AuthenticatedUser
    }

    return null
  } catch (error) {
    console.error('[Auth] Error ensuring user profile exists:', error)
    return null
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

