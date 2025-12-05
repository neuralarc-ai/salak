import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Test endpoint to verify Supabase database connection
 * GET /api/test/db
 */
export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      serviceKeyLength: supabaseServiceKey?.length || 0,
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        envCheck,
        message: 'Please check your .env.local file and ensure all required variables are set.',
      }, { status: 500 })
    }

    // Try to create Supabase client
    let supabase
    try {
      supabase = createServerClient()
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client',
        envCheck,
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 })
    }

    // Test 1: Check if we can query the users table
    let usersTest = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('id, email, name, role', { count: 'exact' })
        .limit(1)

      if (error) {
        usersTest.error = error.message
      } else {
        usersTest.success = true
        usersTest.count = count || 0
      }
    } catch (error) {
      usersTest.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test 2: Check if we can query the documents table
    let documentsTest = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .limit(1)

      if (error) {
        documentsTest.error = error.message
      } else {
        documentsTest.success = true
        documentsTest.count = count || 0
      }
    } catch (error) {
      documentsTest.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test 3: Check if we can query the categories table
    let categoriesTest = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase
        .from('categories')
        .select('id', { count: 'exact' })
        .limit(1)

      if (error) {
        categoriesTest.error = error.message
      } else {
        categoriesTest.success = true
        categoriesTest.count = count || 0
      }
    } catch (error) {
      categoriesTest.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test 4: Check if document_versions table exists
    let versionsTest = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase
        .from('document_versions')
        .select('id', { count: 'exact' })
        .limit(1)

      if (error) {
        versionsTest.error = error.message
      } else {
        versionsTest.success = true
        versionsTest.count = count || 0
      }
    } catch (error) {
      versionsTest.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Test 5: Check if system_logs table exists
    let logsTest = { success: false, error: null, count: 0 }
    try {
      const { data, error, count } = await supabase
        .from('system_logs')
        .select('id', { count: 'exact' })
        .limit(1)

      if (error) {
        logsTest.error = error.message
      } else {
        logsTest.success = true
        logsTest.count = count || 0
      }
    } catch (error) {
      logsTest.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Overall status
    const allTestsPassed = 
      usersTest.success &&
      documentsTest.success &&
      categoriesTest.success &&
      versionsTest.success &&
      logsTest.success

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed
        ? '✅ Database connection successful! All tables are accessible.'
        : '⚠️ Database connection established, but some tables may be missing or have issues.',
      envCheck,
      tests: {
        users: usersTest,
        documents: documentsTest,
        categories: categoriesTest,
        document_versions: versionsTest,
        system_logs: logsTest,
      },
      summary: {
        tablesAccessible: [
          usersTest.success && 'users',
          documentsTest.success && 'documents',
          categoriesTest.success && 'categories',
          versionsTest.success && 'document_versions',
          logsTest.success && 'system_logs',
        ].filter(Boolean),
        tablesWithErrors: [
          !usersTest.success && { table: 'users', error: usersTest.error },
          !documentsTest.success && { table: 'documents', error: documentsTest.error },
          !categoriesTest.success && { table: 'categories', error: categoriesTest.error },
          !versionsTest.success && { table: 'document_versions', error: versionsTest.error },
          !logsTest.success && { table: 'system_logs', error: logsTest.error },
        ].filter(Boolean),
        totalRecords: {
          users: usersTest.count,
          documents: documentsTest.count,
          categories: categoriesTest.count,
          document_versions: versionsTest.count,
          system_logs: logsTest.count,
        },
      },
    }, {
      status: allTestsPassed ? 200 : 500,
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test database connection',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}

