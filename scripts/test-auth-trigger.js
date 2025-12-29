/**
 * Test Auth Trigger Setup
 * Verifies that the database trigger is working correctly
 *
 * Run with: cd frontend && node scripts/test-auth-trigger.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testAuthTrigger() {
  console.log('🧪 Testing Auth Trigger Setup...\n')

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

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Check if trigger function exists
  console.log('1️⃣  Checking trigger function...')
  try {
    const { data: functions, error } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';"
      })

    if (error) {
      console.log('   ⚠️  Cannot check functions via RPC (expected)')
    } else if (functions && functions.length > 0) {
      console.log('   ✅ Trigger function exists')
      testsPassed++
    } else {
      console.log('   ❌ Trigger function not found')
      testsFailed++
    }
  } catch (error) {
    console.log('   ⚠️  Cannot verify function via client (use Supabase SQL Editor)')
  }

  // Test 2: Check if trigger exists
  console.log('\n2️⃣  Checking database trigger...')
  try {
    const { data: triggers, error } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';"
      })

    if (error) {
      console.log('   ⚠️  Cannot check triggers via RPC (expected)')
    } else if (triggers && triggers.length > 0) {
      console.log('   ✅ Database trigger exists')
      testsPassed++
    } else {
      console.log('   ❌ Database trigger not found')
      testsFailed++
    }
  } catch (error) {
    console.log('   ⚠️  Cannot verify trigger via client (use Supabase SQL Editor)')
  }

  // Test 3: Check table permissions
  console.log('\n3️⃣  Checking table permissions...')
  try {
    const { data: permissions, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (!error) {
      console.log('   ✅ Can access users table')
      testsPassed++
    } else {
      console.log(`   ❌ Cannot access users table: ${error.message}`)
      testsFailed++
    }
  } catch (error) {
    console.log(`   ❌ Error accessing users table: ${error.message}`)
    testsFailed++
  }

  // Test 4: Create a test user and verify trigger works
  console.log('\n4️⃣  Testing trigger with real user creation...')
  const testEmail = `test-trigger-${Date.now()}@test.local`
  const testPassword = 'TestPass123'
  const testName = 'Test Trigger User'

  try {
    console.log(`   Creating test user: ${testEmail}`)

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          role: 'user',
        },
      },
    })

    if (authError) {
      console.log(`   ❌ Auth signup failed: ${authError.message}`)
      testsFailed++
    } else if (authData.user) {
      console.log(`   ✅ Auth user created: ${authData.user.id}`)

      // Wait for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if public user was created
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.log(`   ❌ Public user not found: ${userError.message}`)
        testsFailed++
      } else if (publicUser) {
        console.log(`   ✅ Public user created by trigger:`)
        console.log(`      ID: ${publicUser.id}`)
        console.log(`      Email: ${publicUser.email}`)
        console.log(`      Name: ${publicUser.name}`)
        console.log(`      Role: ${publicUser.role}`)
        testsPassed++

        // Clean up test user
        console.log('   🧹 Cleaning up test user...')
        await supabase.auth.admin.deleteUser(authData.user.id)
        await supabase.from('users').delete().eq('id', authData.user.id)
        console.log('   ✅ Test user cleaned up')
      } else {
        console.log('   ❌ Trigger did not create public user')
        testsFailed++
      }
    } else {
      console.log('   ❌ Auth signup returned no user')
      testsFailed++
    }
  } catch (error) {
    console.log(`   ❌ Test user creation failed: ${error.message}`)
    testsFailed++
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Results Summary:')
  console.log(`   ✅ Passed: ${testsPassed}`)
  console.log(`   ❌ Failed: ${testsFailed}`)
  console.log(`   ⚠️  Manual Checks Needed: ${testsPassed === 0 ? 'All' : 'Some'}`)
  console.log('='.repeat(50))

  if (testsFailed === 0 && testsPassed > 0) {
    console.log('\n🎉 Auth trigger is working correctly!')
    console.log('   Users will now appear in public.users table automatically.')
  } else {
    console.log('\n⚠️  Some tests failed or require manual verification.')
    console.log('   Check the setup instructions in AUTH_TRIGGER_SETUP.md')
    console.log('   You may need to run the SQL manually in Supabase.')
  }

  console.log('\n📋 Manual Verification Steps:')
  console.log('   1. Go to Supabase Dashboard > SQL Editor')
  console.log('   2. Run: SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
  console.log('   3. Run: SELECT * FROM pg_proc WHERE proname = \'handle_new_user\';')
  console.log('   4. Test with a real signup at /signup')
  console.log('\n💡 Need help? Check AUTH_TRIGGER_SETUP.md for detailed instructions.\n')

  process.exit(testsFailed > 0 ? 1 : 0)
}

testAuthTrigger().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})
