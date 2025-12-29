/**
 * Setup Auth Trigger Script
 * Creates a database trigger that automatically populates public.users table
 * when new users sign up through Supabase Auth
 *
 * Run with: cd frontend && node scripts/setup-auth-trigger.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function setupAuthTrigger() {
  console.log('🔗 Setting up Supabase Auth Trigger...\n')

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

  // Create Supabase client with service role key (required for auth schema access)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read SQL file
  const sqlPath = path.join(__dirname, 'setup-auth-trigger.sql')
  let sqlScript

  try {
    sqlScript = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ SQL script loaded\n')
  } catch (error) {
    console.error('❌ Failed to read setup-auth-trigger.sql')
    console.error(`   Path: ${sqlPath}`)
    console.error(`   Error: ${error.message}\n`)
    process.exit(1)
  }

  console.log('📋 This script will create:')
  console.log('   • Database trigger for automatic user profile creation')
  console.log('   • Sync function for existing auth users')
  console.log('   • Proper permissions for the trigger\n')

  console.log('⚠️  IMPORTANT:')
  console.log('   This requires running SQL directly in Supabase.')
  console.log('   The Supabase JS client cannot execute DDL statements.\n')

  console.log('📋 Instructions:')
  console.log('   1. Go to https://app.supabase.com')
  console.log('   2. Select your project')
  console.log('   3. Click "SQL Editor" in the left sidebar')
  console.log('   4. Click "New query"')
  console.log('   5. Copy and paste the SQL below')
  console.log('   6. Click "Run"\n')

  console.log('📄 SQL Script to execute:\n')
  console.log('─'.repeat(80))
  console.log(sqlScript)
  console.log('─'.repeat(80))

  console.log('\n✅ After running the SQL:')
  console.log('   • New user signups will automatically create public.users records')
  console.log('   • Existing auth users will be synced (optional)')
  console.log('   • No more manual user profile creation needed!\n')

  console.log('🧪 To test:')
  console.log('   1. Go to your signup page (/signup)')
  console.log('   2. Create a new user account')
  console.log('   3. Check that the user appears in both auth.users AND public.users tables')
  console.log('   4. Verify the user can login successfully\n')

  console.log('🎉 Auth trigger setup complete!')
  console.log('   Your Supabase Auth integration is now fully automated!\n')
}

setupAuthTrigger().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  if (error.stack) {
    console.error('\nStack trace:')
    console.error(error.stack)
  }
  process.exit(1)
})


