/**
 * Database Setup Script - SQL File Generator
 * This script reads the SQL file and provides it in a format ready to copy-paste
 * 
 * Run with: node scripts/setup-database-sql.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const readline = require('readline')

async function setupDatabase() {
  console.log('📋 Database Setup Helper\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local')
    console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set\n')
    process.exit(1)
  }

  console.log('✅ Environment variables found')
  console.log(`   Project URL: ${supabaseUrl}\n`)

  // Read SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql')
  let sqlScript
  
  try {
    sqlScript = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ SQL script loaded from supabase-setup.sql\n')
  } catch (error) {
    console.error('❌ Failed to read supabase-setup.sql')
    console.error(`   Error: ${error.message}\n`)
    process.exit(1)
  }

  console.log('═'.repeat(70))
  console.log('📝 INSTRUCTIONS:')
  console.log('═'.repeat(70))
  console.log('')
  console.log('1. Go to: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Click "SQL Editor" in the left sidebar')
  console.log('4. Click "New query" button')
  console.log('5. Copy the SQL script below and paste it into the editor')
  console.log('6. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)')
  console.log('7. Wait for "Success" message')
  console.log('')
  console.log('═'.repeat(70))
  console.log('📄 SQL SCRIPT (Copy everything below):')
  console.log('═'.repeat(70))
  console.log('')
  console.log(sqlScript)
  console.log('')
  console.log('═'.repeat(70))
  console.log('')
  console.log('💡 Tip: After running, verify tables in "Table Editor"')
  console.log('   You should see: users, documents, categories, document_versions, system_logs')
  console.log('')
  console.log('🧪 Then test at: http://localhost:3000/test-db')
  console.log('')
}

setupDatabase().catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})

