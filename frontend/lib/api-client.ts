/**
 * Client-side API helper functions
 * Handles authentication headers automatically using Supabase sessions
 */

import { supabase } from '../../lib/supabase-client'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  [key: string]: any
}

/**
 * Get current user from Supabase session
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get JWT token from Supabase session (primary) or localStorage (fallback)
 * Ensures Supabase session is always checked first for fresh tokens
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    // Primary: Check Supabase session first (most reliable source)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.warn('AuthToken: Error getting Supabase session:', sessionError.message)
      } else if (session?.access_token) {
        console.log('AuthToken: Found token in Supabase session')
        // Also store in localStorage for fallback
        if (session.access_token) {
          localStorage.setItem('auth_token', session.access_token)
        }
        return session.access_token
      }
    } catch (sessionError) {
      console.warn('AuthToken: Failed to get Supabase session:', sessionError)
    }

    // Fallback: Check localStorage for JWT tokens
    const authToken = localStorage.getItem('auth_token')
    if (authToken && authToken.length > 20) {
      console.log('AuthToken: Found token in localStorage (auth_token)')
      return authToken
    }

    // Check alternative localStorage keys
    const alternativeKeys = ['jwt_token', 'token', 'supabase.auth.token']
    for (const key of alternativeKeys) {
      const token = localStorage.getItem(key)
      if (token) {
        // For supabase.auth.token, parse the JSON structure
        if (key === 'supabase.auth.token') {
          try {
            const parsed = JSON.parse(token)
            if (parsed?.access_token && parsed.access_token.length > 20) {
              console.log('AuthToken: Found token in localStorage (supabase.auth.token)')
              return parsed.access_token
            }
          } catch (error) {
            console.warn('Failed to parse supabase auth token:', error)
          }
        } else if (token.length > 20) {
          console.log(`AuthToken: Found token in localStorage (${key})`)
          return token
        }
      }
    }

    console.log('AuthToken: No token found anywhere')
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Make authenticated API request using Supabase session with localStorage fallback
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Merge in any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  // Get JWT token and add to Authorization header
  const token = await getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    console.warn(`Making unauthenticated request to ${endpoint}`)
  }

  try {
    const fullUrl = `/api${endpoint}`
    console.log(`🚀 API Call: ${options.method || 'GET'} ${fullUrl}`)

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    console.log(`📡 API Response: ${response.status} ${response.statusText} for ${fullUrl}`)

    // Check if response is OK before parsing JSON
    // This prevents "Unexpected token '<'" errors when HTML is returned
    let data
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // If not JSON, try to parse anyway but handle gracefully
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch {
          // If parsing fails, return error with the text
          return {
            success: false,
            error: response.ok ? 'Invalid response format' : `Request failed: ${response.status} ${response.statusText}`,
          }
        }
      }
    } catch (parseError) {
      console.error(`❌ Failed to parse response for ${fullUrl}:`, parseError)
      return {
        success: false,
        error: response.ok ? 'Failed to parse response' : `Request failed: ${response.status} ${response.statusText}`,
      }
    }

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} for ${fullUrl}`, data)
      
      // Include status code in response for handling 401 errors
      return {
        success: false,
        error: data?.error || 'Request failed',
        status: response.status,
        ...data,
      }
    }

    console.log(`✅ API Success: ${fullUrl}`)
    return {
      success: true,
      ...data,
    }
  } catch (error) {
    console.error(`💥 API Network Error for /api${endpoint}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

