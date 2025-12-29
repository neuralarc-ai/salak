import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, getAuthenticatedUserFromSession } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    // First try the session-based authentication
    let user = await getAuthenticatedUserFromSession(request)

    // Fallback to the old localStorage-based approach for compatibility
    if (!user) {
      user = await getAuthenticatedUser(request)
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user exists in public.users table
    // Match strictly by auth user id (UUID), not by email
    const supabase = createServerClient()
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    // Only create if no row is found - do not attempt insert if user already exists
    if (!dbUser && !dbError) {
      // User doesn't exist in public.users table, try to create it
      // This should be handled by ensureUserProfileExists in auth-helpers, but we can try here too
      try {
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()

        if (!listError && authUsers) {
          const authUser = authUsers.users.find(u => u.id === user.id)

          if (authUser) {
            // Only insert if user doesn't exist (handle conflicts gracefully)
            const { error: createError } = await supabase.from('users').insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
              role: authUser.user_metadata?.role || 'user',
            })

            // Handle duplicate key errors gracefully (user was created concurrently)
            if (createError && createError.code !== '23505') {
              console.error('Error creating missing user record:', createError)
            }
          }
        }
      } catch (createError) {
        console.error('Error creating missing user record:', createError)
      }
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

