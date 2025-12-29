import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'

/**
 * DELETE /api/api-keys/[id] - Revoke an API key
 * Soft deletes by setting is_active to false
 * Always returns JSON responses, never HTML
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Get authenticated user - return 401 JSON if not authenticated
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the API key ID from route params (handle both sync and async params)
    const resolvedParams = params instanceof Promise ? await params : params
    const keyId = resolvedParams.id

    // Validate keyId exists
    if (!keyId || typeof keyId !== 'string' || keyId.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
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

    // First, verify the API key exists and belongs to the user
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, name, user_id, is_active')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch API key error:', {
        message: fetchError.message,
        code: fetchError.code,
      })

      // Return appropriate status based on error type
      if (fetchError.code === 'PGRST116' || fetchError.message?.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch API key' },
        { status: 500 }
      )
    }

    // Return 404 if the key doesn't exist or doesn't belong to the user
    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    // Check if already revoked
    if (!existingKey.is_active) {
      return NextResponse.json(
        { error: 'API key is already revoked' },
        { status: 400 }
      )
    }

    // Soft delete: set is_active to false
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Revoke API key error:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      })

      // Try to log the action (don't fail if this fails)
      try {
        await logAction(user.id, 'API Key Revoke', existingKey.name, 'failed', getClientIp(request))
      } catch (logError) {
        console.error('Failed to log action:', logError)
      }

      // Return appropriate status based on error type
      if (updateError.code === 'PGRST116' || updateError.message?.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }

    // Log successful revocation
    try {
      await logAction(user.id, 'API Key Revoke', `${existingKey.name} (${keyId})`, 'success', getClientIp(request))
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log action:', logError)
    }

    // Return success - always JSON
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    })
  } catch (error) {
    // Catch any unexpected errors (network, parsing, etc.)
    console.error('Revoke API key unexpected error:', error)
    
    // Return user-safe error (no stack traces) - always JSON
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

