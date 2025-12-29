/**
 * Debug Trigger Setup
 * Checks if the auth trigger is properly installed and working
 *
 * Run with: cd frontend && node scripts/debug-trigger.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugTrigger() {
  console.log('🔍 Debugging Auth Trigger Setup...\n')

  // Check environment variables
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

  console.log('1️⃣  Checking users table schema...')
  try {
    // Check if users table exists and get its structure
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
      if (usersError.code === 'PGRST205' || usersError.code === 'PGRST116') {
        console.error('   → Schema cache issue - refresh cache in Supabase Dashboard')
      }
      process.exit(1)
    }

    console.log('✅ Users table accessible')

    // Check current users
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting users:', countError.message)
    } else {
      console.log(`📊 Current users in public.users: ${userCount || 0}`)
    }

  } catch (error) {
    console.error('❌ Error checking users table:', error.message)
    process.exit(1)
  }

  console.log('\n2️⃣  Checking auth.users access...')
  try {
    // Try to get auth user count (limited access)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (authError) {
      console.error('❌ Cannot access auth.users:', authError.message)
    } else {
      console.log(`📊 Auth users accessible (sample): ${authUsers?.users?.length || 0} found`)
    }
  } catch (error) {
    console.error('❌ Error checking auth users:', error.message)
  }

  console.log('\n3️⃣  Checking trigger setup (manual verification needed)...')
  console.log('⚠️  Cannot verify trigger existence via JS client')
  console.log('   Please check manually in Supabase SQL Editor:')

  console.log('\n🔍 MANUAL CHECKS REQUIRED:')
  console.log('   1. Go to https://app.supabase.com')
  console.log('   2. Select your project')
  console.log('   3. Go to SQL Editor')
  console.log('   4. Run: SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
  console.log('   5. Run: SELECT * FROM pg_proc WHERE proname = \'handle_new_user\';')
  console.log('   6. Run: SELECT * FROM information_schema.role_table_grants')
  console.log('           WHERE table_name = \'users\' AND grantee IN (\'anon\', \'authenticated\');')

  console.log('\n4️⃣  Testing signup flow...')
  const testEmail = `debug-test-${Date.now()}@example.com`
  console.log(`   Testing with: ${testEmail}`)

  try {
    // Test signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPass123!',
      options: {
        data: {
          full_name: 'Debug Test User',
          role: 'user',
        },
      },
    })

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)
    } else {
      console.log('✅ Signup successful for:', signupData.user?.email)

      // Wait for trigger
      console.log('⏳ Waiting for trigger to execute...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check if user was created in public.users
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', testEmail)
        .single()

      if (userError) {
        console.error('❌ User not found in public.users:', userError.message)
        console.log('\n🔍 POSSIBLE CAUSES:')
        console.log('   • Trigger not installed')
        console.log('   • Trigger function error')
        console.log('   • Schema mismatch')
        console.log('   • Permission issues')
        console.log('   • RLS blocking insert')
      } else {
        console.log('✅ User found in public.users:')
        console.log(`   ID: ${publicUser.id}`)
        console.log(`   Email: ${publicUser.email}`)
        console.log(`   Name: ${publicUser.name}`)
        console.log(`   Role: ${publicUser.role}`)
      }

      // Clean up test user
      if (signupData.user?.id) {
        console.log('🧹 Cleaning up test user...')
        await supabase.auth.admin.deleteUser(signupData.user.id)
        await supabase.from('users').delete().eq('id', signupData.user.id)
        console.log('✅ Test user cleaned up')
      }
    }
  } catch (error) {
    console.error('❌ Test signup error:', error.message)
  }

  console.log('\n📋 SUMMARY:')
  console.log('   • Users table: ✅ Accessible')
  console.log('   • Trigger verification: ⚠️  Manual check required')
  console.log('   • Signup flow: Tested')
  console.log('   • Trigger execution: Needs verification')

  console.log('\n💡 If trigger is not working:')
  console.log('   1. Run the setup script: node scripts/setup-auth-trigger.js')
  console.log('   2. Execute the SQL in Supabase SQL Editor')
  console.log('   3. Test signup again')
  console.log('   4. Check Supabase logs for trigger errors')
}

debugTrigger().catch(console.error)


