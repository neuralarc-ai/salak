/**
 * Create Admin User
 * Creates an admin user for testing admin features
 * Run with: cd frontend && node scripts/create-admin-user.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function createAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   Please check your .env.local file')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n👑 Creating Admin User...\n')

  // Default admin user
  const adminUser = {
    email: 'admin@rdms.com',
    password: 'Admin1234',
    name: 'System Administrator',
    role: 'admin',
  }

  // Allow custom email/password via command line args
  const customEmail = process.argv[2]
  const customPassword = process.argv[3]
  const customName = process.argv[4]

  if (customEmail) {
    adminUser.email = customEmail
  }
  if (customPassword) {
    adminUser.password = customPassword
  }
  if (customName) {
    adminUser.name = customName
  }

  try {
    // Check if admin user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', adminUser.email.toLowerCase())
      .single()

    if (existing) {
      console.log(`⚠️  Admin user ${adminUser.email} already exists!`)
      console.log(`\n📋 Existing Admin User Details:`)
      console.log(`   Email: ${existing.email}`)
      console.log(`   Name: ${existing.name}`)
      console.log(`   Role: ${existing.role}`)
      console.log(`   ID: ${existing.id}`)
      console.log(`\n💡 You can use this admin account to login and access admin features.`)
      console.log(`💡 To create a different admin, use a different email.`)
      console.log(`\n💡 To create with different email:`)
      console.log(`   node scripts/create-admin-user.js newadmin@example.com NewPass123 New Admin Name\n`)
      return
    }

    // Hash password
    const password_hash = await bcrypt.hash(adminUser.password, 10)

    // Create admin user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: adminUser.email.toLowerCase().trim(),
        password_hash,
        name: adminUser.name.trim(),
        role: adminUser.role,
      })
      .select('id, email, name, role')
      .single()

    if (error) {
      console.error(`❌ Failed to create admin user:`, error.message)
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.error('   → Schema cache issue. Refresh cache in Supabase Dashboard.')
        console.error('   → Go to: Settings > API > Refresh Schema Cache')
      }
      process.exit(1)
    }

    console.log('✅ Admin user created successfully!\n')
    console.log('='.repeat(60))
    console.log('👑 Admin Login Credentials:\n')
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${adminUser.password}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    console.log('\n' + '='.repeat(60))
    console.log('\n💡 Admin Features Available:')
    console.log('   • Access to System Logs (/admin/logs)')
    console.log('   • Category Management (/categories)')
    console.log('   • Audit Log Access')
    console.log('   • Delete any document version')
    console.log('   • Full system administration')
    console.log('\n🚀 You can now login with these admin credentials!\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdminUser().catch(console.error)


