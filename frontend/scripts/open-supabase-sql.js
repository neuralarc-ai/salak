/**
 * Open Supabase SQL Editor Helper
 * Displays the SQL script and opens Supabase in browser
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql')

console.log('\n📋 Supabase Table Setup\n')
console.log('═'.repeat(80))
console.log('')

// Read and display SQL
try {
  const sqlScript = fs.readFileSync(sqlPath, 'utf8')
  
  console.log('📝 SQL Script (copy this):')
  console.log('─'.repeat(80))
  console.log(sqlScript)
  console.log('─'.repeat(80))
  console.log('')
  
  console.log('📋 SETUP STEPS:')
  console.log('')
  console.log('1. Go to: https://app.supabase.com')
  console.log('2. Select your project')
  console.log('3. Click "SQL Editor" in left sidebar')
  console.log('4. Click "New query" button')
  console.log('5. Paste the SQL script above')
  console.log('6. Click "Run" (or press Ctrl+Enter)')
  console.log('7. Wait for success message')
  console.log('8. Go to Settings > API > Refresh Schema Cache')
  console.log('9. Wait 10-30 seconds')
  console.log('10. Run: npm run setup:verify')
  console.log('')
  console.log('💡 Tip: The SQL script is also saved in: frontend/supabase-setup.sql')
  console.log('')
  
  // Try to open browser (optional)
  const platform = process.platform
  let command
  
  if (platform === 'darwin') {
    command = 'open https://app.supabase.com'
  } else if (platform === 'win32') {
    command = 'start https://app.supabase.com'
  } else {
    command = 'xdg-open https://app.supabase.com'
  }
  
  console.log('🌐 Opening Supabase Dashboard in browser...')
  exec(command, (error) => {
    if (error) {
      console.log('   (Could not open browser automatically)')
      console.log('   Please visit: https://app.supabase.com manually')
    }
  })
  
} catch (error) {
  console.error('❌ Error reading SQL file:', error.message)
  process.exit(1)
}

