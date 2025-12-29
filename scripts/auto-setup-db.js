/**
 * Auto Database Setup Script
 * This script runs before the dev server starts to ensure database is ready
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function autoSetupDatabase() {
  console.log('\n🚀 Auto Database Setup Check\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Supabase environment variables not found')
    console.log('   Skipping database check\n')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const requiredTables = ['users', 'documents', 'categories', 'document_versions', 'system_logs']
  const missingTables = []
  const cacheIssues = []

  console.log('🔍 Checking database tables...\n')

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === 'PGRST116') {
          missingTables.push(table)
          console.log(`❌ ${table}: Table does not exist`)
        } else if (error.code === 'PGRST205') {
          cacheIssues.push(table)
          console.log(`⚠️  ${table}: Schema cache issue`)
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table}: Ready`)
      }
    } catch (error) {
      missingTables.push(table)
      console.log(`❌ ${table}: ${error.message}`)
    }
  }

  console.log('')

  if (missingTables.length > 0 || cacheIssues.length > 0) {
    console.log('⚠️  DATABASE SETUP REQUIRED\n')
    
    if (missingTables.length > 0) {
      console.log(`   Missing tables: ${missingTables.join(', ')}`)
    }
    
    if (cacheIssues.length > 0) {
      console.log(`   Schema cache issues: ${cacheIssues.join(', ')}`)
    }

    console.log('\n📋 QUICK SETUP:\n')
    console.log('   Option 1: Web Interface (Recommended)')
    console.log('   → Visit: http://localhost:3000/db-init')
    console.log('   → Copy the SQL script')
    console.log('   → Run in Supabase SQL Editor\n')
    
    console.log('   Option 2: Command Line')
    console.log('   → Run: npm run setup:db')
    console.log('   → Copy the SQL script shown')
    console.log('   → Run in Supabase SQL Editor\n')
    
    console.log('   Option 3: Manual Steps')
    console.log('   1. Go to: https://app.supabase.com')
    console.log('   2. SQL Editor > New query')
    console.log('   3. Copy SQL from: frontend/supabase-setup.sql')
    console.log('   4. Paste and run')
    console.log('   5. Refresh schema cache: Settings > API > Refresh Schema Cache\n')

    // Read and display SQL script location
    const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql')
    if (fs.existsSync(sqlPath)) {
      const stats = fs.statSync(sqlPath)
      console.log(`   SQL Script: ${sqlPath}`)
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB\n`)
    }

    console.log('💡 After setup, the server will automatically detect the tables.\n')
  } else {
    console.log('✅ All database tables are ready!')
    console.log('   You can start using the application.\n')
  }
}

// Run the check
autoSetupDatabase().catch(error => {
  console.error('\n❌ Database check error:', error.message)
  console.log('   Continuing anyway...\n')
})

