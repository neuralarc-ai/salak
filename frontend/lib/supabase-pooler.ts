/**
 * Supabase Connection Pooler Configuration
 * 
 * This module provides Supabase clients configured to work with connection pooling.
 * The Supabase JS client uses PostgREST REST API which handles connection pooling
 * automatically, but we configure it to avoid cache issues and use pooled connections.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Create a server-side Supabase client with connection pooling configuration
 * Uses service role key for admin operations and bypasses RLS
 */
export function createPooledServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Configure client for connection pooling and cache avoidance
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'rdms-server-pooled',
        'Prefer': 'return=representation',
      },
      // Custom fetch with connection pooling headers
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Headers to avoid schema cache issues
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            // Connection pooling headers
            'Connection': 'keep-alive',
            'Keep-Alive': 'timeout=5, max=1000',
          },
        })
      },
    },
  })
}

/**
 * Create a browser-side Supabase client with connection pooling
 * Uses anon key and respects RLS policies
 */
export function createPooledBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'rdms-browser-pooled',
      },
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
          },
        })
      },
    },
  })
}

/**
 * Get a fresh client instance (useful for avoiding cache issues)
 * Creates a new client with current timestamp to avoid connection reuse
 */
export function getFreshServerClient(): SupabaseClient {
  return createPooledServerClient()
}

