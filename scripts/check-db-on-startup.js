/**
 * Database Check Script - Run on startup
 * Checks if tables exist and provides setup instructions if needed
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')

async function checkDatabaseOnStartup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase environment variables not found')
    console.log('   Database check skipped\n')
    return
  }

  console.log('🔍 Checking database tables on startup...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const requiredTables = ['users', 'documents', 'categories', 'document_versions', 'system_logs']
  const missingTables = []

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          missingTables.push(table)
          console.log(`❌ ${table}: Table missing or schema cache issue`)
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table}: OK`)
      }
    } catch (error) {
      missingTables.push(table)
      console.log(`❌ ${table}: ${error.message}`)
    }
  }

  console.log('')

  if (missingTables.length > 0) {
    console.log('⚠️  WARNING: Some tables are missing!')
    console.log(`   Missing: ${missingTables.join(', ')}\n`)
    console.log('📋 TO FIX:')
    console.log('   1. Run: npm run setup:db')
    console.log('   2. Copy the SQL script shown')
    console.log('   3. Go to: https://app.supabase.com')
    console.log('   4. SQL Editor > New query > Paste SQL > Run')
    console.log('   5. Refresh schema cache in Settings > API\n')
    console.log('   Or visit: http://localhost:3000/api/db/init\n')
  } else {
    console.log('✅ All database tables are ready!\n')
  }
}

// Run check
checkDatabaseOnStartup().catch(console.error)

