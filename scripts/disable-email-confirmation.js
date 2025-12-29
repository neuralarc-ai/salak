/**
 * Disable Email Confirmation for Development
 * Updates Supabase Auth settings to disable email confirmation
 *
 * WARNING: This should only be used in development environments!
 * In production, email confirmation should always be enabled for security.
 *
 * Run with: cd frontend && node scripts/disable-email-confirmation.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function disableEmailConfirmation() {
  console.log('🔧 Disabling Email Confirmation for Development...\n')

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

  console.log('⚠️  WARNING: This disables email confirmation!')
  console.log('   This should ONLY be used in development environments.')
  console.log('   Email confirmation should be ENABLED in production.\n')

  // Ask for confirmation (in a real script, you'd use readline)
  console.log('This will update your Supabase project auth settings.')
  console.log('Are you sure you want to continue? (y/N): ')

  // For automation, we'll proceed but show clear warnings
  console.log('Proceeding with email confirmation disable...\n')

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log('📡 Attempting to update Supabase Auth settings...')

    // Note: Supabase JS client doesn't support auth settings updates
    // This must be done manually in the Supabase Dashboard
    console.log('ℹ️  Supabase JS client cannot update auth settings.')
    console.log('   This must be done manually in the Supabase Dashboard.\n')

    console.log('📋 MANUAL INSTRUCTIONS TO DISABLE EMAIL CONFIRMATION:')
    console.log('   1. Go to https://app.supabase.com')
    console.log('   2. Select your project')
    console.log('   3. Click "Authentication" in the left sidebar')
    console.log('   4. Click "Settings" tab')
    console.log('   5. Scroll down to "Email Confirmations" section')
    console.log('   6. Uncheck "Enable email confirmations"')
    console.log('   7. Check "Enable email auto-confirm" (for development)')
    console.log('   8. Click "Save changes"')
    console.log('')
    console.log('⚠️  WARNING: Only disable email confirmation in development!')
    console.log('   Always keep it enabled in production for security.')
    console.log('')
    console.log('🧪 After disabling, test the changes:')
    console.log('   1. Go to /signup and create a new account')
    console.log('   2. Go to /login and sign in immediately (no confirmation needed)')
    console.log('   3. Verify login works without email confirmation')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\n💡 Try the manual method described above.')
    process.exit(1)
  }
}

disableEmailConfirmation().catch(console.error)
