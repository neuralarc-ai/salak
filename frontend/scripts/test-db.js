/**
 * Script to test Supabase database connection
 * Run with: node scripts/test-db.js
 */

require('dotenv').config({ path: '.env.local' })

async function testDatabase() {
  console.log('🔍 Testing Supabase Database Connection...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('📋 Environment Variables Check:')
  console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}\n`)

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables!')
    console.error('Please create a .env.local file with your Supabase credentials.\n')
    process.exit(1)
  }

  try {
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('🔌 Testing Database Connection...\n')

    // Test each table
    const tables = [
      { name: 'users', required: true },
      { name: 'documents', required: true },
      { name: 'categories', required: true },
      { name: 'document_versions', required: false },
      { name: 'system_logs', required: true },
    ]

    const results = []

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (error) {
          if (error.code === 'PGRST116') {
            results.push({
              table: table.name,
              status: '❌ Table does not exist',
              error: error.message,
              required: table.required,
            })
          } else {
            results.push({
              table: table.name,
              status: '⚠️ Error accessing table',
              error: error.message,
              required: table.required,
            })
          }
        } else {
          results.push({
            table: table.name,
            status: '✅ Accessible',
            count: count || 0,
            required: table.required,
          })
        }
      } catch (err) {
        results.push({
          table: table.name,
          status: '❌ Connection error',
          error: err.message,
          required: table.required,
        })
      }
    }

    // Display results
    console.log('📊 Test Results:\n')
    results.forEach((result) => {
      const required = result.required ? '(Required)' : '(Optional)'
      console.log(`${result.status} ${result.table} ${required}`)
      if (result.count !== undefined) {
        console.log(`   Records: ${result.count}`)
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      console.log()
    })

    // Summary
    const allRequiredPassed = results
      .filter((r) => r.required)
      .every((r) => r.status.includes('✅'))

    const allPassed = results.every((r) => r.status.includes('✅'))

    console.log('📈 Summary:')
    if (allRequiredPassed) {
      console.log('✅ All required tables are accessible!')
    } else {
      console.log('❌ Some required tables are missing or inaccessible.')
      console.log('   Please run the SQL setup script in Supabase.')
    }

    if (allPassed) {
      console.log('✅ All tables are accessible!')
    } else {
      console.log('⚠️ Some optional tables may be missing.')
    }

    console.log('\n💡 Next Steps:')
    if (!allRequiredPassed) {
      console.log('   1. Go to your Supabase project SQL Editor')
      console.log('   2. Copy and paste the contents of supabase-setup.sql')
      console.log('   3. Run the SQL script to create all tables')
    } else {
      console.log('   ✅ Database is ready! You can now use the API endpoints.')
    }

    process.exit(allRequiredPassed ? 0 : 1)
  } catch (error) {
    console.error('\n❌ Fatal Error:')
    console.error(error.message)
    if (error.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

testDatabase()

