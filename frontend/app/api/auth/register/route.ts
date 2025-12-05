import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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

    // Use pooled connection client to avoid cache issues
    const supabase = createServerClient()

    // Retry logic for schema cache issues
    let existingUser = null
    let checkError = null
    const maxRetries = 3
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()
      
      existingUser = result.data
      checkError = result.error
      
      // If no error or not a cache error, break
      if (!checkError || (checkError.code !== 'PGRST205' && checkError.code !== 'PGRST116')) {
        break
      }
      
      // If it's a cache error, wait and retry
      if (checkError.code === 'PGRST205' && attempt < maxRetries) {
        console.log(`Schema cache issue, retrying... (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        continue
      }
      
      break
    }

    // Handle schema cache error or missing table
    if (checkError && (checkError.code === 'PGRST205' || checkError.code === 'PGRST116')) {
      console.error('Table not found - schema cache or table missing', {
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      })
      
      // Both PGRST116 and PGRST205 can mean schema cache issue
      // PGRST116 = table not in schema cache
      // PGRST205 = schema cache error
      // Since verification script shows tables exist, this is likely a cache issue
      return NextResponse.json(
        { 
          error: 'Database schema cache needs to be refreshed. The tables exist but are not visible to the API. Please: 1) Go to Supabase Dashboard > Settings > API, 2) Click "Refresh Schema Cache" or "Reload Schema", 3) Wait 30-60 seconds, 4) Try again.',
          code: 'SCHEMA_CACHE_ERROR',
          setupUrl: '/db-init',
          hint: 'After refreshing schema cache in Supabase, wait 30-60 seconds before trying again. Tables are created but cache needs refresh.',
          errorCode: checkError.code,
        },
        { status: 503 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Create user with explicit error handling
    const insertResult = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        password_hash,
        name: name.trim(),
        role: 'user', // Always set to 'user' for public registration
      })
      .select('id, email, name, role')
      .single()
    
    const user = insertResult.data
    const userError = insertResult.error

    if (userError || !user) {
      // Log detailed error information for debugging
      console.error('Registration error details:', {
        error: userError,
        code: userError?.code,
        message: userError?.message,
        details: userError?.details,
        hint: userError?.hint,
        user: user,
      })
      
      // Handle specific Supabase errors
      if (userError?.code === 'PGRST205' || userError?.code === 'PGRST116') {
        // Both errors indicate schema cache issue when tables exist
        return NextResponse.json(
          { 
            error: 'Database schema cache needs to be refreshed. Please: 1) Go to Supabase Dashboard > Settings > API, 2) Click "Refresh Schema Cache" or "Reload Schema", 3) Wait 30-60 seconds, 4) Try again.',
            code: 'SCHEMA_CACHE_ERROR',
            setupUrl: '/db-init',
            hint: 'After refreshing schema cache in Supabase, wait 30-60 seconds before trying again.',
            errorCode: userError.code,
          },
          { status: 503 }
        )
      }

      // Handle duplicate email error
      if (userError?.code === '23505' || userError?.message?.includes('duplicate') || userError?.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }

      // Handle RLS policy errors
      if (userError?.code === '42501' || userError?.message?.includes('permission denied') || userError?.message?.includes('policy')) {
        console.error('RLS Policy error - check RLS policies in Supabase')
        return NextResponse.json(
          { 
            error: 'Permission denied. Please check Row Level Security policies in Supabase. The service role key should bypass RLS.',
            code: 'RLS_ERROR',
            details: userError?.message
          },
          { status: 403 }
        )
      }

      // Return detailed error for debugging
      const errorDetails = {
        error: 'Failed to create user. Please try again.',
        code: userError?.code || 'UNKNOWN',
        message: userError?.message || 'Unknown error occurred',
        hint: userError?.hint || 'Check server logs for more details',
        details: userError?.details || null,
      }
      
      // Always log full error for debugging
      console.error('Full registration error:', JSON.stringify(errorDetails, null, 2))
      
      return NextResponse.json(
        errorDetails,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Account created successfully',
    }, { status: 201 })
  } catch (error) {
    // Log the full error for debugging
    console.error('Registration catch error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined
        })
      },
      { status: 500 }
    )
  }
}

