import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        {
          error: 'Server configuration error: Missing Supabase credentials. Please check .env.local file.',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      )
    }

    const { email, password, name, role = 'user' } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Only allow 'user' role for public registration
    // Admins must be created by existing admins
    if (role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid role. Only user accounts can be created through registration.' },
        { status: 403 }
      )
    }

    // Validate Supabase URL format before creating client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.error('Invalid Supabase URL format:', supabaseUrl)
      return NextResponse.json(
        {
          error: 'Invalid Supabase configuration. Please check your .env.local file.',
          code: 'CONFIG_ERROR',
          hint: 'Supabase URL should be in format: https://xxxxx.supabase.co'
        },
        { status: 500 }
      )
    }

    // Create Supabase client with service role for server-side operations
    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } catch (clientError) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        {
          error: 'Failed to connect to database. Please check your Supabase configuration.',
          code: 'CONNECTION_ERROR',
          details: clientError instanceof Error ? clientError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Note: We don't check for existing users by email here
    // Supabase Auth will handle duplicate email validation
    // User profiles are matched strictly by auth user id (UUID), not by email

    // Sign up user with Supabase Auth
    // The database trigger will automatically create the public.users record
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: name.trim(), // Primary field for trigger
          name: name.trim(),      // Fallback field
          role: 'user',           // Always set to 'user' for public registration
        },
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase Auth signup error:', authError)

      // Handle specific auth errors
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      if (authError?.message?.includes('Password should be at least')) {
        return NextResponse.json(
          { error: 'Password does not meet requirements' },
          { status: 400 }
        )
      }

      if (authError?.message?.includes('Invalid email')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: 'Failed to create account. Please try again.',
          code: authError?.status || 'AUTH_ERROR',
          details: authError?.message || 'Unknown authentication error'
        },
        { status: 500 }
      )
    }

    // Ensure user profile exists in public.users table
    // Match strictly by auth user id (UUID), not by email
    // The database trigger should create it automatically, but we verify and create if needed
    let userProfile = null
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (!profileCheckError && existingProfile) {
      // Profile exists (created by trigger)
      userProfile = existingProfile
      console.log('User profile created by trigger:', userProfile.email)
    } else if (!existingProfile) {
      // Profile doesn't exist (trigger may have failed), create it manually
      // Only create if no row is found - do not attempt insert if user already exists
      console.log('User profile not found after signup, creating manually...')
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email.toLowerCase().trim(),
          name: name.trim(),
          role: 'user',
        })
        .select('id, email, name, role')
        .maybeSingle()

      if (createError) {
        // Handle duplicate key errors (user was created between check and insert)
        if (createError.code === '23505') {
          // User was created by trigger or another process, fetch it by UUID
          console.log('User profile was created concurrently, fetching existing record')
          const { data: fetchedProfile, error: fetchError } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('id', authData.user.id)
            .maybeSingle()
          
          if (!fetchError && fetchedProfile) {
            userProfile = fetchedProfile
            console.log('User profile found after conflict:', userProfile.email)
          }
        } else {
          // Handle duplicate email errors gracefully (shouldn't happen with UUID matching)
          if (createError.message?.includes('email') || createError.message?.includes('unique')) {
            console.warn('Duplicate email detected during user creation, but UUID matching should prevent this')
            // Try to fetch by UUID instead
            const { data: fetchedProfile, error: fetchError } = await supabase
              .from('users')
              .select('id, email, name, role')
              .eq('id', authData.user.id)
              .maybeSingle()
            
            if (!fetchError && fetchedProfile) {
              userProfile = fetchedProfile
              console.log('User profile found after email conflict:', userProfile.email)
            }
          } else {
            console.error('Failed to create user profile:', createError.message, 'Code:', createError.code)
            // Continue anyway - user can still login and profile will be created on first auth
          }
        }
      } else if (newProfile) {
        userProfile = newProfile
        console.log('User profile created manually:', userProfile.email)
      } else {
        // Insert succeeded but no data returned, try fetching
        const { data: fetchedProfile, error: fetchError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('id', authData.user.id)
          .maybeSingle()
        
        if (!fetchError && fetchedProfile) {
          userProfile = fetchedProfile
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: userProfile || {
        id: authData.user.id,
        email: authData.user.email,
        name: name.trim(),
        role: 'user',
      },
      message: 'Account created successfully. Please check your email to verify your account.',
    }, { status: 201 })
  } catch (error) {
    // Log the full error for debugging
    console.error('Registration catch error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    // Handle network/DNS errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('fetch failed') || errorMessage.includes('getaddrinfo') || errorMessage.includes('ENOTFOUND')) {
      return NextResponse.json(
        {
          error: 'Cannot connect to database. Please check your internet connection and Supabase configuration.',
          code: 'NETWORK_ERROR',
          hint: 'Verify your NEXT_PUBLIC_SUPABASE_URL in .env.local is correct and your Supabase project is active.',
          details: errorMessage
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    )
  }
}

