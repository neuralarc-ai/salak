/**
 * Automated Database Setup Script
 * This script creates all required tables in Supabase using the Supabase client
 * 
 * Run with: node scripts/setup-database.js
 * Or: npm run setup:db
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupDatabase() {
  console.log('🚀 Starting Database Setup...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables!')
    console.error('Please ensure .env.local contains:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY\n')
    process.exit(1)
  }

  console.log('✅ Environment variables found')
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...\n`)

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
    console.error(`   Path: ${sqlPath}`)
    console.error(`   Error: ${error.message}\n`)
    process.exit(1)
  }

  // Split SQL script into individual statements
  // Remove comments and split by semicolons
  const statements = sqlScript
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0
  const errors = []

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    
    // Skip empty statements
    if (!statement || statement.length < 10) continue

    try {
      // Execute using Supabase RPC or direct query
      // Note: Supabase client doesn't support raw SQL directly
      // We'll use the REST API approach
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      })

      if (error) {
        // Try alternative: use REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: statement + ';' }),
        })

        if (!response.ok) {
          // If RPC doesn't work, we'll need to use the SQL editor approach
          // For now, let's try executing via PostgREST or provide instructions
          throw new Error('Direct SQL execution not available via client')
        }
      }

      successCount++
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`   Progress: ${i + 1}/${statements.length} statements\r`)
      }
    } catch (error) {
      // Supabase JS client doesn't support raw SQL execution
      // We need to use a different approach
      console.log('\n⚠️  Direct SQL execution via client is not supported.')
      console.log('   Supabase requires SQL to be run via the SQL Editor.\n')
      console.log('📋 Please run the SQL script manually:\n')
      console.log('   1. Go to https://app.supabase.com')
      console.log('   2. Select your project')
      console.log('   3. Click "SQL Editor"')
      console.log('   4. Click "New query"')
      console.log('   5. Copy and paste the contents of: supabase-setup.sql')
      console.log('   6. Click "Run"\n')
      
      // Provide the SQL content
      console.log('📄 SQL Script Content:\n')
      console.log('─'.repeat(60))
      console.log(sqlScript)
      console.log('─'.repeat(60))
      
      process.exit(1)
    }
  }

  console.log(`\n✅ Setup complete!`)
  console.log(`   Successful: ${successCount}`)
  console.log(`   Errors: ${errorCount}\n`)

  if (errorCount > 0) {
    console.log('❌ Errors encountered:')
    errors.forEach(err => console.log(`   - ${err}\n`))
    process.exit(1)
  }

  // Verify tables
  console.log('🔍 Verifying tables...\n')
  const tables = ['users', 'documents', 'categories', 'document_versions', 'system_logs']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Accessible (${count || 0} records)`)
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
    }
  }

  console.log('\n🎉 Database setup complete!')
  console.log('   You can now test the connection at: http://localhost:3000/test-db\n')
}

setupDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  if (error.stack) {
    console.error('\nStack trace:')
    console.error(error.stack)
  }
  process.exit(1)
})

