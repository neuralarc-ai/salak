/**
 * Direct Login Test - Tests login by directly calling the login route logic
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function testLoginDirect() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🔐 Testing Login Logic Directly...\n')

  const testEmail = 'admin@rdms.com'
  const testPassword = 'Admin1234'

  try {
    console.log(`Testing: ${testEmail} / ${testPassword}\n`)

    // Step 1: Get user from database
    console.log('Step 1: Fetching user from database...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', testEmail.toLowerCase())
      .single()

    if (userError) {
      console.error(`❌ Database error: ${userError.code} - ${userError.message}`)
      console.error(`   Details: ${JSON.stringify(userError, null, 2)}`)
      
      // Try without .single() to see all users
      console.log('\nTrying to list all users...')
      const { data: allUsers, error: listError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .limit(5)
      
      if (listError) {
        console.error(`❌ List error: ${listError.message}`)
      } else {
        console.log(`✅ Found ${allUsers?.length || 0} users:`)
        allUsers?.forEach(u => {
          console.log(`   - ${u.email} (${u.name}, ${u.role})`)
        })
      }
      return
    }

    if (!user) {
      console.error('❌ User not found in database')
      return
    }

    console.log(`✅ User found: ${user.name} (${user.role})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Has password_hash: ${!!user.password_hash}`)

    // Step 2: Verify password
    if (!user.password_hash) {
      console.error('❌ User has no password hash!')
      return
    }

    console.log('\nStep 2: Verifying password...')
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash)

    if (!isValidPassword) {
      console.error('❌ Password verification failed!')
      console.log('   Testing with new hash...')
      const newHash = await bcrypt.hash(testPassword, 10)
      const testWithNewHash = await bcrypt.compare(testPassword, newHash)
      console.log(`   New hash test: ${testWithNewHash ? '✅ Works' : '❌ Failed'}`)
      console.log(`   → Password hash in database might be incorrect`)
      console.log(`   → User might need to be recreated with correct password`)
    } else {
      console.log('✅ Password verification successful!')
      console.log('\n✅ Login should work!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

testLoginDirect().catch(console.error)




