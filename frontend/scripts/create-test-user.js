/**
 * Create Test User Script
 * Generates bcrypt hash and creates test users in Supabase
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function createTestUser() {
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

  console.log('\n🔐 Creating Test Users...\n')

  // Test credentials
  const testUsers = [
    {
      email: 'admin@rdms.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'user@rdms.com',
      password: 'user123',
      name: 'Test User',
      role: 'user',
    },
  ]

  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', testUser.email)
        .single()

      if (existing) {
        console.log(`⚠️  User ${testUser.email} already exists, skipping...`)
        continue
      }

      // Hash password
      const password_hash = await bcrypt.hash(testUser.password, 10)

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: testUser.email,
          password_hash,
          name: testUser.name,
          role: testUser.role,
        })
        .select('id, email, name, role')
        .single()

      if (error) {
        console.error(`❌ Failed to create ${testUser.email}:`, error.message)
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          console.error('   → Schema cache issue. Refresh cache in Supabase Dashboard.')
        }
      } else {
        console.log(`✅ Created user: ${testUser.email}`)
        console.log(`   Password: ${testUser.password}`)
        console.log(`   Role: ${testUser.role}\n`)
      }
    } catch (error) {
      console.error(`❌ Error creating ${testUser.email}:`, error.message)
    }
  }

  console.log('\n📋 Test Credentials:\n')
  console.log('Admin User:')
  console.log('  Email: admin@rdms.com')
  console.log('  Password: admin123\n')
  console.log('Regular User:')
  console.log('  Email: user@rdms.com')
  console.log('  Password: user123\n')
}

createTestUser().catch(console.error)

