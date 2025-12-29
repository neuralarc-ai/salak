import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'
import { encryptApiKey } from '@/lib/encryption'

/**
 * GET /api/api-keys - Get all API keys for the authenticated user
 * Returns only metadata, never the actual encrypted key values
 * Does NOT decrypt keys - only returns metadata fields
 */
export async function GET(request: NextRequest) {
  try {
    // Log authentication attempt
    const authHeader = request.headers.get('authorization')
    console.log('[API Keys GET] Auth header present:', !!authHeader)
    
    // Validate authentication - return 401 JSON if not authenticated
    const user = await getAuthenticatedUser(request)

    if (!user) {
      console.log('[API Keys GET] Authentication failed - no user returned')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API Keys GET] User authenticated:', user.email, 'ID:', user.id)

    // Validate user.id exists
    if (!user.id || typeof user.id !== 'string') {
      console.error('Invalid user object:', { hasId: !!user.id, idType: typeof user.id })
      return NextResponse.json(
        { error: 'Invalid user session' },
        { status: 401 }
      )
    }

    let supabase
    try {
      supabase = createServerClient()
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    // Fetch API keys - only return metadata, never the actual encrypted key values
    // Explicitly select only metadata fields to avoid any issues with encrypted columns
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, is_active, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      // Log full error server-side only
      console.error('Get API keys Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
      })

      // Return user-safe error message
      // Check for specific error types that should return different status codes
      if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Check for table/column errors
      if (error.message?.includes('relation') || error.message?.includes('column') || error.message?.includes('does not exist')) {
        console.error('Database schema error detected:', error.message)
        return NextResponse.json(
          { error: 'Database configuration error. Please contact support.' },
          { status: 500 }
        )
      }

      // For other database errors, return generic message
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    // Ensure we return an array even if data is null/undefined
    const safeApiKeys = Array.isArray(apiKeys) ? apiKeys : []

    // Return JSON response - always JSON, never HTML
    return NextResponse.json({
      success: true,
      apiKeys: safeApiKeys,
    })
  } catch (error) {
    // Catch any unexpected errors (network, parsing, etc.)
    console.error('Get API keys unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    // Return user-safe error (no stack traces) - always JSON
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/api-keys - Store a user-provided API key
 * Encrypts the API key using AES-256-GCM before storing
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { name, apiKey } = body

    // Validate name - must exist, be a string, and have minimum length
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'API Key Name is required and must be a string' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      return NextResponse.json(
        { error: 'API Key Name is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedName.length < 3) {
      return NextResponse.json(
        { error: 'API Key Name must be at least 3 characters long' },
        { status: 400 }
      )
    }

    // Validate API key
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json(
        { error: 'API key is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Validate API key format (should be a secure token)
    if (apiKey.trim().length < 32) {
      return NextResponse.json(
        { error: 'API key must be at least 32 characters long' },
        { status: 400 }
      )
    }

    // All validation passed - now proceed with database operations
    let supabase
    try {
      supabase = createServerClient()
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    // Check if name already exists for this user
    const { data: existing, error: checkError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', trimmedName)
      .maybeSingle()

    if (checkError) {
      console.error('Check existing API key error:', {
        message: checkError.message,
        code: checkError.code,
      })
      
      // Return appropriate status based on error type
      if (checkError.code === 'PGRST116' || checkError.message?.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      // Database error checking for existing name - return 500 as this is unexpected
      return NextResponse.json(
        { error: 'Failed to validate API key name' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { error: 'An API key with this name already exists' },
        { status: 400 }
      )
    }

    // Encrypt the API key using AES-256-GCM
    let encryptedData
    try {
      encryptedData = encryptApiKey(apiKey.trim())
    } catch (encryptionError) {
      console.error('Encryption error:', encryptionError)
      
      // Check if it's a configuration error (missing secret)
      if (encryptionError instanceof Error && encryptionError.message.includes('API_KEY_ENCRYPTION_SECRET')) {
        return NextResponse.json(
          { error: 'Service configuration error. Please contact support.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to encrypt API key' },
        { status: 500 }
      )
    }

    // Validate encrypted data structure
    if (!encryptedData.encrypted_key || !encryptedData.iv || !encryptedData.auth_tag) {
      console.error('Invalid encryption result:', { hasEncrypted: !!encryptedData.encrypted_key, hasIv: !!encryptedData.iv, hasAuthTag: !!encryptedData.auth_tag })
      return NextResponse.json(
        { error: 'Encryption failed' },
        { status: 500 }
      )
    }

    // Store API key record with encrypted data
    const { data: apiKeyRecord, error: createError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: trimmedName,
        encrypted_key: encryptedData.encrypted_key,
        iv: encryptedData.iv,
        auth_tag: encryptedData.auth_tag,
        is_active: true,
      })
      .select('id, name, is_active, created_at')
      .single()

    if (createError) {
      console.error('Store API key Supabase error:', {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
      })

      // Try to log the action (don't fail if this fails)
      try {
        await logAction(user.id, 'API Key Store', trimmedName, 'failed', getClientIp(request))
      } catch (logError) {
        console.error('Failed to log action:', logError)
      }

      // Return appropriate status based on error type
      if (createError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'An API key with this name already exists' },
          { status: 400 }
        )
      }

      if (createError.code === 'PGRST116' || createError.message?.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to store API key' },
        { status: 500 }
      )
    }

    if (!apiKeyRecord) {
      console.error('Store API key returned no data')
      try {
        await logAction(user.id, 'API Key Store', trimmedName, 'failed', getClientIp(request))
      } catch (logError) {
        console.error('Failed to log action:', logError)
      }
      return NextResponse.json(
        { error: 'Failed to store API key' },
        { status: 500 }
      )
    }

    // Log successful storage
    try {
      await logAction(user.id, 'API Key Store', `${trimmedName} (${apiKeyRecord.id})`, 'success', getClientIp(request))
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log action:', logError)
    }

    // Return success - note: we don't return the actual key, user should have saved it
    return NextResponse.json({
      success: true,
      message: 'API key stored securely. It cannot be viewed again after storage.',
      apiKey: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        is_active: apiKeyRecord.is_active,
        created_at: apiKeyRecord.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    // Catch any unexpected errors (network, parsing, etc.)
    console.error('Store API key unexpected error:', error)
    
    // Return user-safe error (no stack traces)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

