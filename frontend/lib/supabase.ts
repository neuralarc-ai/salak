import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client with connection pooling
 * Uses service role key for admin operations and bypasses RLS
 * Configured to use pooled connections and avoid schema cache issues
 */
export function createServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

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
      // Use default fetch - don't override to avoid header conflicts with undici
      // Cache-busting and connection pooling are handled automatically
    },
  })
}

/**
 * Client-side Supabase client with connection pooling
 * Uses anon key and respects RLS policies
 */
export function createBrowserClient(): SupabaseClient {
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
      // Use default fetch - no custom headers needed
    },
  })
}

/**
 * Get a fresh client instance to avoid connection reuse issues
 * Useful when you need to ensure a new connection
 */
export function getFreshServerClient(): SupabaseClient {
  return createServerClient()
}

