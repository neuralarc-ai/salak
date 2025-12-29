import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Create Supabase client for auth operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[Login Debug] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...'
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Login Debug] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Test basic connectivity
    console.log('[Login Debug] Testing basic Supabase connectivity...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      console.log('[Login Debug] Basic connectivity test:', {
        success: !testError,
        error: testError,
        data: testData
      })
    } catch (connectError) {
      console.error('[Login Debug] Basic connectivity failed:', connectError)
    }

    // Verify service role key is working by testing basic connectivity
    console.log('[Login Debug] Testing Supabase client connectivity...')
    try {
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      console.log('[Login Debug] Basic connectivity test:', {
        success: !testError,
        error: testError?.message,
        hasData: !!testData
      })
    } catch (connectError) {
      console.error('[Login Debug] Supabase client connection failed:', connectError)
    }

    // Debug log for admin login attempts
    const isAdminAttempt = normalizedEmail.includes('admin') || normalizedEmail.includes('Admin')
    if (isAdminAttempt) {
      console.log('[Admin Login] Starting admin login attempt for:', normalizedEmail)
    }

    // Initialize mutable variables for authentication flow
    let authenticatedUser = null
    let authMethod = 'supabase'
    let authSession = null

    // First, try Supabase Auth sign in
    console.log('[Login] Attempting Supabase Auth login for:', normalizedEmail)
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (supabaseError || !supabaseData?.user) {
      // Supabase auth failed, try custom authentication
      if (isAdminAttempt) {
        console.log('[Admin Login] Supabase Auth failed, trying custom authentication:', supabaseError?.message)
      }
      console.log('[Login] Supabase Auth failed, trying custom authentication:', supabaseError?.message)

      // Fallback to custom authentication using password_hash in users table
      if (isAdminAttempt) {
        console.log('[Admin Login] Querying database for admin user:', normalizedEmail)
      }

      // First test: Simple query to check table access
      console.log('[Login Debug] Testing basic users table access...')
      const { data: basicTest, error: basicError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      console.log('[Login Debug] Basic table test result:', {
        success: !basicError,
        error: basicError ? {
          message: basicError.message,
          code: basicError.code,
          details: basicError.details,
          hint: basicError.hint,
          fullError: basicError
        } : null,
        hasData: !!basicTest
      })

      // Second test: Check table schema
      console.log('[Login Debug] Checking users table schema...')
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .rpc('exec_sql', {
            sql: `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns
              WHERE table_name = 'users'
              AND table_schema = 'public'
              ORDER BY ordinal_position;
            `
          })

        console.log('[Login Debug] Table schema result:', {
          success: !schemaError,
          columns: schemaData,
          error: schemaError ? {
            message: schemaError.message,
            code: schemaError.code,
            fullError: schemaError
          } : null
        })
      } catch (schemaErr) {
        console.log('[Login Debug] Schema check failed:', schemaErr instanceof Error ? schemaErr.message : String(schemaErr))
      }

      // Test query with RLS disabled (for debugging)
      console.log('[Login Debug] Testing query with RLS bypass...')
      try {
        const { data: rlsTest, error: rlsError } = await supabase
          .rpc('exec_sql', {
            sql: `SELECT id, email, name, role FROM users WHERE email = '${normalizedEmail.replace(/'/g, "''")}' LIMIT 1;`
          })

        console.log('[Login Debug] RLS bypass test result:', {
          success: !rlsError,
          data: rlsTest,
          error: rlsError ? {
            message: rlsError.message,
            code: rlsError.code,
            fullError: rlsError
          } : null
        })
      } catch (rlsErr) {
        console.log('[Login Debug] RLS bypass test failed:', rlsErr instanceof Error ? rlsErr.message : String(rlsErr))
      }

      // Now try the actual query
      console.log('[Login Debug] Executing actual user lookup query...')
      const queryStart = Date.now()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role, password_hash')
        .eq('email', normalizedEmail)
        .maybeSingle()
      const queryEnd = Date.now()

      console.log('[Login Debug] Query execution time:', queryEnd - queryStart, 'ms')
      console.log('[Login Debug] Query result:', {
        hasData: !!userData,
        dataKeys: userData ? Object.keys(userData) : null,
        error: userError ? {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint,
          fullError: userError
        } : null
      })

      if (userError) {
        console.error('[Login] FULL DATABASE ERROR during custom auth:', {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint,
          email: normalizedEmail,
          table: 'users',
          operation: 'SELECT with password_hash',
          fullErrorObject: userError,
          supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
          hasServiceKey: !!supabaseServiceKey
        })
        if (isAdminAttempt) {
          console.error('[Admin Login] FULL DATABASE ERROR for admin login:', {
            message: userError.message,
            code: userError.code,
            details: userError.details,
            hint: userError.hint,
            email: normalizedEmail,
            fullErrorObject: userError
          })
        }

        // Check for specific error types
        if (userError.code === 'PGRST116' || userError.message?.includes('relation "public.users" does not exist')) {
          console.error('[Login] Users table does not exist! Run database setup first.')
          return NextResponse.json(
            { error: 'Database not initialized. Please run database setup.' },
            { status: 503 }
          )
        }

        if (userError.code === 'PGRST205' || userError.message?.includes('permission denied')) {
          console.error('[Login] Permission denied accessing users table. Check RLS policies.')
          return NextResponse.json(
            { error: 'Database permission error. Contact administrator.' },
            { status: 503 }
          )
        }

        return NextResponse.json(
          {
            error: 'Authentication service temporarily unavailable',
            details: process.env.NODE_ENV === 'development' ? {
              dbError: userError.message,
              code: userError.code,
              table: 'users',
              operation: 'SELECT with password_hash'
            } : undefined
          },
          { status: 503 }
        )
      }

      if (!userData) {
        if (isAdminAttempt) {
          console.log('[Admin Login] Admin user not found in database:', normalizedEmail)
        }
        console.log('[Login] User not found in database:', normalizedEmail)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (!userData.password_hash) {
        if (isAdminAttempt) {
          console.log('[Admin Login] Admin user has no password hash:', userData.email, 'Role:', userData.role)
        }
        console.log('[Login] User has no password hash:', userData.email)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Verify password using bcrypt
      if (isAdminAttempt) {
        console.log('[Admin Login] Verifying password hash for admin user:', userData.email, 'Role:', userData.role)
      }
      console.log('[Login] Verifying password hash for user:', userData.email)
      const isPasswordValid = await bcrypt.compare(password, userData.password_hash)

      if (!isPasswordValid) {
        if (isAdminAttempt) {
          console.log('[Admin Login] Password verification failed for admin user:', userData.email)
        }
        console.log('[Login] Password verification failed for user:', userData.email)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Custom authentication successful
      authenticatedUser = userData
      authMethod = 'custom'
      authSession = {
        access_token: `custom_${userData.id}_${Date.now()}`, // Temporary token for session
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
      }

      if (isAdminAttempt) {
        console.log('[Admin Login] Custom authentication successful for admin user:', userData.email, 'Role:', userData.role)
      }
      console.log('[Login] Custom authentication successful for user:', userData.email, 'Role:', userData.role)

    } else {
      // Supabase authentication successful
      console.log('[Login] Supabase Auth successful for user:', supabaseData.user.email)
      authenticatedUser = supabaseData.user
      authSession = supabaseData.session

      if (isAdminAttempt) {
        console.log('[Admin Login] Supabase Auth successful for admin user:', supabaseData.user.email)
      }

      // For Supabase auth, check if email is confirmed
      if (!supabaseData.user.email_confirmed_at) {
        console.log('[Login] Email not confirmed for Supabase user:', supabaseData.user.email)
        return NextResponse.json(
          {
            error: 'Please confirm your email address before signing in. Check your email for a confirmation link.',
            code: 'EMAIL_NOT_CONFIRMED',
            hint: 'Click the confirmation link in your email, then try signing in again.'
          },
          { status: 401 }
        )
      }
    }

    if (!authenticatedUser) {
      console.error('[Login] No user data after authentication')
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile data
    let userProfile = null

    if (authMethod === 'supabase') {
      console.log('[Login] Fetching user profile for Supabase user:', authenticatedUser.id)
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', authenticatedUser.id)
        .single()

      if (profileError) {
        console.error('[Login] Profile fetch error:', profileError)
        // Still return success but with basic user data from auth
        const supabaseUser = authenticatedUser as any // Type assertion for Supabase user
        userProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
          role: supabaseUser.user_metadata?.role || 'user',
        }
      } else {
        userProfile = profileData
      }
    } else {
      // For custom auth, we already have the user profile
      userProfile = authenticatedUser
    }

    if (isAdminAttempt) {
      console.log('[Admin Login] Final admin user profile:', userProfile.email, 'Role:', userProfile.role, 'Auth method:', authMethod)
    }
    console.log('[Login] Final user profile:', userProfile.email, 'Role:', userProfile.role)

    // Create unified auth response
    const authResponse = {
      success: true,
      user: userProfile,
      session: {
        access_token: authSession?.access_token,
        refresh_token: authSession?.refresh_token,
        expires_at: authSession?.expires_at,
      },
      auth_method: authMethod // Include auth method for debugging
    }

    // Set httpOnly cookie for iframe authentication
    const response = NextResponse.json(authResponse)

    // Set httpOnly cookie with JWT token for iframe authentication
    if (authSession?.access_token) {
      console.log('[Login] Setting accessToken cookie for iframe authentication')
      response.cookies.set('accessToken', authSession.access_token, {
        httpOnly: true,
        secure: false, // Allow in development over HTTP
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    )
  }
}

