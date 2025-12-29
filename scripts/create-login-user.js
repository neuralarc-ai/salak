/**
 * Create Single Login User
 * Creates one test user for login testing
 * Run with: cd frontend && node scripts/create-login-user.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function createLoginUser() {
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

  console.log('\n👤 Creating Login Test User...\n')

  // Default test user
  const testUser = {
    email: 'test@rdms.com',
    password: 'Test1234',
    name: 'Test User',
    role: 'user',
  }

  // Allow custom email/password via command line args
  const customEmail = process.argv[2]
  const customPassword = process.argv[3]
  const customName = process.argv[4]

  if (customEmail) {
    testUser.email = customEmail
  }
  if (customPassword) {
    testUser.password = customPassword
  }
  if (customName) {
    testUser.name = customName
  }

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', testUser.email.toLowerCase())
      .single()

    if (existing) {
      console.log(`⚠️  User ${testUser.email} already exists!`)
      console.log(`\n📋 Existing User Details:`)
      console.log(`   Email: ${existing.email}`)
      console.log(`   Name: ${existing.name}`)
      console.log(`   Role: ${existing.role}`)
      console.log(`   ID: ${existing.id}`)
      console.log(`\n💡 You can use this user to login, or create a new one with different email.\n`)
      console.log(`💡 To create with different email:`)
      console.log(`   node scripts/create-login-user.js newemail@example.com NewPass123 New Name\n`)
      return
    }

    // Hash password
    const password_hash = await bcrypt.hash(testUser.password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: testUser.email.toLowerCase().trim(),
        password_hash,
        name: testUser.name.trim(),
        role: testUser.role,
      })
      .select('id, email, name, role')
      .single()

    if (error) {
      console.error(`❌ Failed to create user:`, error.message)
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.error('   → Schema cache issue. Refresh cache in Supabase Dashboard.')
      }
      process.exit(1)
    }

    console.log('✅ User created successfully!\n')
    console.log('='.repeat(60))
    console.log('📋 Login Credentials:\n')
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${testUser.password}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    console.log('\n' + '='.repeat(60))
    console.log('\n💡 You can now use these credentials to login!\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createLoginUser().catch(console.error)




