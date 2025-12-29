/**
 * Simple script to display the SQL setup script
 * Run with: node scripts/show-sql.js
 */

const fs = require('fs')
const path = require('path')

const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql')

try {
  const sqlScript = fs.readFileSync(sqlPath, 'utf8')
  
  console.log('═'.repeat(80))
  console.log('📋 SUPABASE DATABASE SETUP')
  console.log('═'.repeat(80))
  console.log('')
  console.log('📝 INSTRUCTIONS:')
  console.log('')
  console.log('1. Go to: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Click "SQL Editor" in the left sidebar')
  console.log('4. Click "New query" button')
  console.log('5. Copy the SQL script below (everything between the lines)')
  console.log('6. Paste it into the Supabase SQL Editor')
  console.log('7. Click "Run" button (or press Ctrl+Enter / Cmd+Enter)')
  console.log('8. Wait for "Success" message')
  console.log('')
  console.log('═'.repeat(80))
  console.log('📄 COPY THE SQL BELOW:')
  console.log('═'.repeat(80))
  console.log('')
  console.log(sqlScript)
  console.log('')
  console.log('═'.repeat(80))
  console.log('')
  console.log('✅ After running, verify tables in "Table Editor"')
  console.log('   You should see: users, documents, categories, document_versions, system_logs')
  console.log('')
  console.log('🧪 Then test at: http://localhost:3000/test-db')
  console.log('')
} catch (error) {
  console.error('❌ Error reading SQL file:', error.message)
  console.error('   Path:', sqlPath)
  process.exit(1)
}

