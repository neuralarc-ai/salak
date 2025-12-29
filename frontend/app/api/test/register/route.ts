import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

/**
 * Test endpoint to diagnose registration issues
 * GET /api/test/register
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Test 1: Check if we can read from users table
    const { data: readTest, error: readError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1)
    
    // Test 2: Try to insert a test user (will delete it after)
    const testEmail = `test-${Date.now()}@test.com`
    const testPasswordHash = await bcrypt.hash('test123', 10)
    
    const { data: insertTest, error: insertError } = await supabase
      .from('users')
      .insert({
        email: testEmail,
        password_hash: testPasswordHash,
        name: 'Test User',
        role: 'user',
      })
      .select('id, email, name, role')
      .single()
    
    // If insert succeeded, delete the test user
    if (insertTest) {
      await supabase
        .from('users')
        .delete()
        .eq('id', insertTest.id)
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        read: {
          success: !readError,
          error: readError ? {
            code: readError.code,
            message: readError.message,
            details: readError.details,
            hint: readError.hint,
          } : null,
          data: readTest,
        },
        insert: {
          success: !insertError,
          error: insertError ? {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          } : null,
          data: insertTest,
        },
      },
      environment: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      },
    })
  } catch (error) {
    console.error('Test registration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

