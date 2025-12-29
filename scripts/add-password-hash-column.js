/**
 * Add password_hash column to users table
 * Run with: node scripts/add-password-hash-column.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')

async function addPasswordHashColumn() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔧 Adding password_hash column to users table...')

  try {
    // Add the password_hash column if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;'
    })

    if (error) {
      console.error('❌ Failed to add password_hash column:', error.message)
      console.log('💡 Try running this SQL manually in your Supabase SQL Editor:')
      console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;')
      process.exit(1)
    }

    console.log('✅ Successfully added password_hash column to users table')

    // Verify the column was added
    const { data, error: verifyError } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .limit(1)

    if (verifyError) {
      console.error('❌ Error verifying column addition:', verifyError.message)
    } else {
      console.log('✅ Column verification successful')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.log('💡 Try running this SQL manually in your Supabase SQL Editor:')
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;')
  }
}

addPasswordHashColumn().catch(console.error)

