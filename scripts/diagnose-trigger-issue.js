/**
 * Diagnose Trigger Issue
 * Comprehensive debugging of why users aren't being inserted into public.users
 *
 * Run with: cd frontend && node scripts/diagnose-trigger-issue.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function diagnoseTriggerIssue() {
  console.log('🔍 Diagnosing Trigger Issue...\n')

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

  console.log('1️⃣  Checking current users in public.users...\n')

  try {
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })

    if (publicError) {
      console.error('❌ Error fetching public users:', publicError.message)
      process.exit(1)
    }

    console.log(`📊 Found ${publicUsers.length} users in public.users:`)
    publicUsers.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.created_at.substring(0, 10)}`)
    })
    if (publicUsers.length > 5) {
      console.log(`   ... and ${publicUsers.length - 5} more`)
    }
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }

  console.log('2️⃣  Checking Supabase Auth users...\n')

  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100 // Get more users
    })

    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      console.log('   This might indicate permission issues')
    } else {
      console.log(`📊 Found ${authUsers.users.length} users in auth.users:`)
      authUsers.users.slice(0, 5).forEach((user, index) => {
        const confirmed = user.email_confirmed_at ? '✅' : '❌'
        console.log(`   ${index + 1}. ${user.email} ${confirmed} - ${user.created_at.substring(0, 10)}`)
      })
      if (authUsers.users.length > 5) {
        console.log(`   ... and ${authUsers.users.length - 5} more`)
      }
      console.log('')
    }

    // Check for auth users without public profiles
    if (authUsers && authUsers.users) {
      console.log('3️⃣  Finding auth users missing from public.users...\n')

      const authEmails = new Set(authUsers.users.map(u => u.email.toLowerCase()))
      const publicEmails = new Set()

      // Get all public user emails
      const { data: allPublicUsers } = await supabase
        .from('users')
        .select('email')

      if (allPublicUsers) {
        allPublicUsers.forEach(u => publicEmails.add(u.email.toLowerCase()))
      }

      const missingFromPublic = []
      authUsers.users.forEach(authUser => {
        if (!publicEmails.has(authUser.email.toLowerCase())) {
          missingFromPublic.push(authUser)
        }
      })

      if (missingFromPublic.length > 0) {
        console.log(`❌ Found ${missingFromPublic.length} auth users missing from public.users:`)
        missingFromPublic.forEach(user => {
          const confirmed = user.email_confirmed_at ? 'confirmed' : 'unconfirmed'
          console.log(`   • ${user.email} (${confirmed}) - ID: ${user.id}`)
        })
        console.log('')
        console.log('🔍 This indicates the trigger is NOT working!')
        console.log('   Auth users are created but no corresponding public.users records.')
        console.log('')
      } else {
        console.log('✅ All auth users have corresponding public.users records\n')
      }
    }

  } catch (error) {
    console.error('❌ Error checking auth users:', error.message)
  }

  console.log('4️⃣  Manual trigger verification required...\n')

  console.log('⚠️  IMPORTANT: You must manually check if the trigger exists in Supabase\n')

  console.log('📋 MANUAL VERIFICATION STEPS:')
  console.log('   1. Go to https://app.supabase.com')
  console.log('   2. Select your project')
  console.log('   3. Click "SQL Editor"')
  console.log('   4. Run this query:')
  console.log('      SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
  console.log('')
  console.log('   Expected result: 1 row with trigger details')
  console.log('   If no rows: Trigger is NOT installed ❌')
  console.log('')
  console.log('   5. Run this query:')
  console.log('      SELECT * FROM pg_proc WHERE proname = \'handle_new_user\';')
  console.log('')
  console.log('   Expected result: 1 row with function details')
  console.log('   If no rows: Function is NOT created ❌')
  console.log('')

  console.log('5️⃣  If trigger is missing, install it:\n')

  console.log('📄 RUN THIS SQL IN SUPABASE SQL EDITOR:')
  console.log('────────────────────────────────────────')
  console.log('')

  // Read and display the trigger SQL
  const fs = require('fs')
  const path = require('path')
  const sqlPath = path.join(__dirname, 'setup-auth-trigger.sql')

  try {
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log(sqlContent)
  } catch (error) {
    console.error('❌ Could not read trigger SQL file')
  }

  console.log('')
  console.log('────────────────────────────────────────')
  console.log('')

  console.log('6️⃣  Testing trigger with a real signup...\n')

  // Test with a valid email
  const testEmail = `trigger-test-${Date.now()}@testdomain.local`
  console.log(`Testing signup with: ${testEmail}`)

  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPass123!',
      options: {
        data: {
          full_name: 'Trigger Test User',
          role: 'user',
        },
      },
    })

    if (signupError) {
      console.error('❌ Signup failed:', signupError.message)

      if (signupError.message.includes('email address') && signupError.message.includes('invalid')) {
        console.log('   → Email domain rejected by Supabase')
        console.log('   → Try with a real email or disable email confirmation')
      }
    } else {
      console.log('✅ Signup successful')
      console.log('   User ID:', signupData.user?.id)
      console.log('   Email:', signupData.user?.email)

      // Wait for trigger
      console.log('⏳ Waiting 3 seconds for trigger...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Check if public user was created
      const { data: publicUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', signupData.user.id)
        .single()

      if (userError) {
        console.error('❌ Public user NOT created by trigger')
        console.error('   Error:', userError.message)
        console.log('')
        console.log('🔍 POSSIBLE CAUSES:')
        console.log('   1. Trigger not installed (check manually)')
        console.log('   2. Trigger function has errors')
        console.log('   3. Schema mismatch in INSERT statement')
        console.log('   4. RLS policies blocking the insert')
        console.log('   5. Function permissions incorrect')
      } else {
        console.log('✅ Public user created successfully by trigger!')
        console.log('   Name:', publicUser.name)
        console.log('   Role:', publicUser.role)
      }

      // Clean up
      console.log('🧹 Cleaning up test user...')
      if (signupData.user?.id) {
        await supabase.auth.admin.deleteUser(signupData.user.id)
        await supabase.from('users').delete().eq('id', signupData.user.id)
      }
      console.log('✅ Test user cleaned up')
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  console.log('\n📋 SUMMARY & NEXT STEPS:')
  console.log('')
  console.log('🔍 ISSUE IDENTIFIED:')
  console.log('   Users signup successfully in Supabase Auth')
  console.log('   But corresponding records are NOT created in public.users')
  console.log('')
  console.log('✅ SOLUTION:')
  console.log('   1. Check if trigger exists (manual SQL queries above)')
  console.log('   2. If missing, execute the trigger SQL')
  console.log('   3. Test with a real signup')
  console.log('   4. Verify user appears in both tables')
  console.log('')
  console.log('🚀 QUICK FIX:')
  console.log('   Run: node scripts/setup-auth-trigger.js')
  console.log('   Then execute the displayed SQL in Supabase SQL Editor')
}

diagnoseTriggerIssue().catch(console.error)


