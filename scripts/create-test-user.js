/**
 * Create Test User Script
 * Creates test users in Supabase Auth (they will be synced to public.users via trigger)
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')

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

  console.log('\n🔐 Creating Test Users in Supabase Auth...\n')

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
      console.log(`🔄 Creating user: ${testUser.email}`)

      // Check if user already exists in our database
      const { data: existingDbUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', testUser.email)
        .single()

      if (existingDbUser) {
        console.log(`⚠️  User ${testUser.email} already exists in database`)

        // Check if user also exists in Supabase Auth
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password,
          })

          if (error && error.message.includes('Invalid login credentials')) {
            console.log(`   → User exists in DB but not in Supabase Auth. Creating in Supabase Auth...`)

            // Create user in Supabase Auth
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
              email: testUser.email,
              password: testUser.password,
              options: {
                data: {
                  full_name: testUser.name,
                  name: testUser.name,
                  role: testUser.role,
                },
              },
            })

            if (signupError) {
              console.error(`   ❌ Failed to create in Supabase Auth: ${signupError.message}`)
            } else {
              console.log(`   ✅ Created in Supabase Auth`)
            }
          } else {
            console.log(`   → User also exists in Supabase Auth, skipping`)
          }
        } catch (authError) {
          console.error(`   ❌ Error checking Supabase Auth: ${authError.message}`)
        }

        continue
      }

      // Create user in Supabase Auth (this will trigger the database trigger to create the public.users record)
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            full_name: testUser.name,
            name: testUser.name,
            role: testUser.role,
          },
        },
      })

      if (error) {
        console.error(`❌ Failed to create ${testUser.email} in Supabase Auth:`, error.message)

        // Handle specific errors
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          console.log(`   → User already exists in Supabase Auth`)
          console.log(`   → If login fails, user may need email confirmation`)
          console.log(`   → Check Supabase Dashboard → Authentication → Users`)
        }
      } else if (data.user) {
        console.log(`✅ Created user in Supabase Auth: ${testUser.email}`)
        console.log(`   User ID: ${data.user.id}`)
        console.log(`   Email confirmed: ${!!data.user.email_confirmed_at}`)

        // The database trigger should have created the public.users record
        // Let's verify it exists
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, email, name, role')
          .eq('email', testUser.email)
          .single()

        if (dbUser) {
          console.log(`   ✅ Database record created successfully`)
        } else {
          console.log(`   ⚠️  Database record not found - trigger may not be working`)
        }
      } else {
        console.error(`❌ Unexpected response when creating ${testUser.email}`)
      }

      console.log('') // Empty line for spacing
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

  console.log('⚠️  IMPORTANT: Users may need email confirmation!')
  console.log('   If login fails, check if email confirmation is required in your Supabase project.')
  console.log('   You can disable email confirmation in Supabase Dashboard → Authentication → Settings')
}

createTestUser().catch(console.error)

