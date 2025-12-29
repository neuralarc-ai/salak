import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase clients
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createServerClient()
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Start a transaction-like approach (Supabase doesn't support transactions across auth and database)
    try {
      // First, delete from public.users table
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (userDeleteError) {
        console.error('User deletion error:', userDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete user profile' },
          { status: 500 }
        )
      }

      // Then delete from Supabase Auth
      const { error: authDeleteError } = await supabaseAuth.auth.admin.deleteUser(user.id)

      if (authDeleteError) {
        console.error('Auth user deletion error:', authDeleteError)
        // Note: User profile is already deleted, but auth user remains
        // This is a partial deletion state that should be handled manually
        return NextResponse.json(
          {
            error: 'Account partially deleted. Profile removed but auth account may remain. Please contact support.',
            partial: true
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
      })
    } catch (deleteError) {
      console.error('Account deletion error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


