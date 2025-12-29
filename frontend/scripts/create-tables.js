/**
 * Automated Table Creation Script
 * Attempts to create tables via Supabase REST API
 * Falls back to instructions if direct execution isn't possible
 */

// Try .env.local first, then .env
require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function createTables() {
  console.log('🚀 Starting Automated Table Creation...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('   Please ensure .env.local contains:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY\n')
    process.exit(1)
  }

  console.log('✅ Environment variables found')
  console.log(`   URL: ${supabaseUrl}\n`)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql')
  let sqlScript
  
  try {
    sqlScript = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ SQL script loaded\n')
  } catch (error) {
    console.error('❌ Failed to read supabase-setup.sql')
    process.exit(1)
  }

  // Split into individual statements
  const statements = sqlScript
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s.length > 10)

  console.log(`📝 Found ${statements.length} SQL statements\n`)

  // Try to execute via REST API (PostgREST doesn't support DDL, but we'll try)
  console.log('⚠️  Note: Supabase REST API does not support DDL operations (CREATE TABLE, etc.)')
  console.log('   These must be run through the Supabase SQL Editor.\n')
  console.log('📋 Attempting alternative method...\n')

  // Try using the Management API or direct PostgreSQL connection
  // Since we can't execute DDL via REST, we'll provide the SQL and instructions
  
  console.log('═'.repeat(80))
  console.log('📄 SQL SCRIPT TO RUN IN SUPABASE SQL EDITOR:')
  console.log('═'.repeat(80))
  console.log('')
  console.log(sqlScript)
  console.log('')
  console.log('═'.repeat(80))
  console.log('')

  // Check if tables already exist
  console.log('🔍 Checking existing tables...\n')
  const tables = ['users', 'documents', 'categories', 'document_versions', 'system_logs']
  const existingTables = []
  const missingTables = []

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          missingTables.push(table)
          console.log(`❌ ${table}: Table does not exist`)
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
          missingTables.push(table)
        }
      } else {
        existingTables.push(table)
        console.log(`✅ ${table}: Exists (${count || 0} records)`)
      }
    } catch (error) {
      missingTables.push(table)
      console.log(`❌ ${table}: ${error.message}`)
    }
  }

  console.log('')

  if (missingTables.length === 0) {
    console.log('🎉 All tables already exist!')
    console.log('   Database is ready to use.\n')
    return
  }

  if (missingTables.length > 0) {
    console.log(`⚠️  ${missingTables.length} table(s) are missing:`)
    missingTables.forEach(t => console.log(`   - ${t}`))
    console.log('')
    console.log('📋 TO CREATE TABLES:')
    console.log('')
    console.log('   1. Go to: https://app.supabase.com')
    console.log('   2. Select your project')
    console.log('   3. Click "SQL Editor" in the left sidebar')
    console.log('   4. Click "New query"')
    console.log('   5. Copy the SQL script shown above')
    console.log('   6. Paste into the SQL Editor')
    console.log('   7. Click "Run" (or Ctrl+Enter / Cmd+Enter)')
    console.log('   8. Wait for "Success" message')
    console.log('')
    console.log('   Then run this script again to verify: npm run setup:verify')
    console.log('')
  }
}

// Verification function
async function verifyTables() {
  console.log('🔍 Verifying Database Tables...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const tables = [
    { name: 'users', required: true },
    { name: 'documents', required: true },
    { name: 'categories', required: true },
    { name: 'document_versions', required: false },
    { name: 'system_logs', required: true },
  ]

  let allPassed = true
  const results = []

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`❌ ${table.name}: Table does not exist ${table.required ? '(REQUIRED)' : '(OPTIONAL)'}`)
          results.push({ table: table.name, status: 'missing', required: table.required })
          if (table.required) allPassed = false
        } else {
          console.log(`⚠️  ${table.name}: ${error.message}`)
          results.push({ table: table.name, status: 'error', error: error.message, required: table.required })
          if (table.required) allPassed = false
        }
      } else {
        console.log(`✅ ${table.name}: Accessible (${count || 0} records)`)
        results.push({ table: table.name, status: 'ok', count: count || 0, required: table.required })
      }
    } catch (error) {
      console.log(`❌ ${table.name}: ${error.message}`)
      results.push({ table: table.name, status: 'error', error: error.message, required: table.required })
      if (table.required) allPassed = false
    }
  }

  console.log('')

  if (allPassed) {
    console.log('🎉 All required tables are accessible!')
    console.log('   Database is ready to use.')
    console.log('   Test at: http://localhost:3000/test-db\n')
  } else {
    console.log('❌ Some required tables are missing.')
    console.log('   Please run the SQL script in Supabase SQL Editor.\n')
  }

  return { allPassed, results }
}

// Run based on command line argument
const command = process.argv[2]

if (command === 'verify') {
  verifyTables().catch(console.error)
} else {
  createTables().then(() => {
    console.log('\n🔍 Running verification...\n')
    return verifyTables()
  }).catch(console.error)
}

