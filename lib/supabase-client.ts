import { createBrowserClient } from './supabase'

export const supabase = createBrowserClient()

// Helper function to get current session
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}


