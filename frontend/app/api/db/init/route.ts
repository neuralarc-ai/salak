import { NextRequest, NextResponse } from 'next/server'
import { verifyDatabaseReady, checkAllTables } from '@/lib/db-init'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/db/init - Check database status and provide setup SQL if needed
 */
export async function GET(request: NextRequest) {
  try {
    const status = await verifyDatabaseReady()
    const tables = await checkAllTables()

    // Read SQL setup script
    const sqlPath = join(process.cwd(), 'supabase-setup.sql')
    let sqlScript = ''
    
    try {
      sqlScript = readFileSync(sqlPath, 'utf8')
    } catch (error) {
      console.error('Failed to read SQL script:', error)
    }

    return NextResponse.json({
      ready: status.ready,
      tables,
      missingTables: status.missingTables,
      message: status.message,
      sqlScript: sqlScript || null,
      instructions: status.ready ? null : [
        '1. Go to https://app.supabase.com',
        '2. Select your project',
        '3. Click "SQL Editor"',
        '4. Click "New query"',
        '5. Copy and paste the SQL script below',
        '6. Click "Run"',
        '7. Wait for success message',
        '8. Refresh schema cache in Settings > API > Refresh Schema Cache',
      ],
    })
  } catch (error) {
    console.error('Database init check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check database status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/db/init - Attempt to initialize database (will provide SQL if direct execution not possible)
 */
export async function POST(request: NextRequest) {
  try {
    const status = await verifyDatabaseReady()

    if (status.ready) {
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized',
      })
    }

    // Read SQL setup script
    const sqlPath = join(process.cwd(), 'supabase-setup.sql')
    let sqlScript = ''
    
    try {
      sqlScript = readFileSync(sqlPath, 'utf8')
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to read SQL setup script' },
        { status: 500 }
      )
    }

    // Note: Supabase REST API doesn't support DDL operations
    // We can only provide the SQL script for manual execution
    return NextResponse.json({
      success: false,
      message: 'Tables need to be created manually in Supabase SQL Editor',
      missingTables: status.missingTables,
      sqlScript,
      instructions: [
        '1. Go to https://app.supabase.com',
        '2. Select your project',
        '3. Click "SQL Editor" in the left sidebar',
        '4. Click "New query" button',
        '5. Copy the SQL script from the sqlScript field below',
        '6. Paste it into the SQL Editor',
        '7. Click "Run" button (or press Ctrl+Enter)',
        '8. Wait for "Success" message',
        '9. Go to Settings > API and click "Refresh Schema Cache"',
        '10. Try your request again',
      ],
    }, { status: 200 })
  } catch (error) {
    console.error('Database init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}

