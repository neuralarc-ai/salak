/**
 * Fix Admin Password Hash
 * Updates existing admin user with bcrypt-hashed password
 * Run with: node scripts/fix-admin-password-hash.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function fixAdminPasswordHash() {
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

  console.log('🔧 Fixing Admin Password Hash...\n')

  const adminEmail = 'admin@rdms.com'
  const adminPassword = 'Admin1234'

  try {
    // Check if admin user exists and get current data
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', adminEmail)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch admin user:', fetchError.message)
      process.exit(1)
    }

    if (!existingUser) {
      console.error('❌ Admin user not found')
      process.exit(1)
    }

    console.log('📋 Current Admin User Status:')
    console.log(`   Email: ${existingUser.email}`)
    console.log(`   Name: ${existingUser.name}`)
    console.log(`   Role: ${existingUser.role}`)
    console.log(`   Has password hash: ${!!existingUser.password_hash}`)

    // Hash the password
    console.log('\n🔐 Hashing password...')
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    // Update the user with password hash
    console.log('💾 Updating user with password hash...')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', existingUser.id)
      .select('id, email, name, role, password_hash')
      .single()

    if (updateError) {
      console.error('❌ Failed to update admin user:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Admin user updated successfully!\n')
    console.log('👑 Admin Login Credentials:')
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   Has password hash: ${!!updatedUser.password_hash}`)

    // Test the password verification
    console.log('\n🔍 Testing password verification...')
    const isValid = await bcrypt.compare(adminPassword, updatedUser.password_hash)
    console.log(`   Password verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixAdminPasswordHash().catch(console.error)
