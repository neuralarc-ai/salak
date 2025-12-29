/**
 * Verify Users Script
 * Checks if users exist in database and verifies password hashes
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function verifyUsers() {
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

  console.log('🔍 Verifying Users in Database...\n')

  const testUsers = [
    { email: 'admin@rdms.com', password: 'Admin1234' },
    { email: 'john@rdms.com', password: 'password123' },
    { email: 'jane@rdms.com', password: 'password123' },
  ]

  for (const testUser of testUsers) {
    console.log(`Checking: ${testUser.email}`)
    
    try {
      // Get user from database - try both lowercase and original email
      let user, error
      
      // Try lowercase first
      const result1 = await supabase
        .from('users')
        .select('id, email, name, role, password_hash')
        .eq('email', testUser.email.toLowerCase())
        .single()
      
      user = result1.data
      error = result1.error
      
      // If not found, try original email
      if (error || !user) {
        const result2 = await supabase
          .from('users')
          .select('id, email, name, role, password_hash')
          .eq('email', testUser.email)
          .single()
        
        user = result2.data
        error = result2.error
      }

      if (error || !user) {
        console.error(`   ❌ User not found: ${error?.message || 'No user found'}`)
        console.log(`   → User might not exist in database\n`)
        continue
      }

      console.log(`   ✅ User found: ${user.name} (${user.role})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Password hash exists: ${user.password_hash ? 'Yes' : 'No'}`)

      // Test password verification
      if (user.password_hash) {
        const isValid = await bcrypt.compare(testUser.password, user.password_hash)
        console.log(`   Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
        
        if (!isValid) {
          console.log(`   ⚠️  Password hash doesn't match!`)
          console.log(`   → Regenerating hash for testing...`)
          const newHash = await bcrypt.hash(testUser.password, 10)
          console.log(`   New hash: ${newHash.substring(0, 30)}...`)
        }
      } else {
        console.log(`   ❌ No password hash found!`)
      }

      console.log('')
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`)
    }
  }
}

verifyUsers().catch(console.error)

