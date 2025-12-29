/**
 * Test Login Script
 * Tests login with dummy credentials to check for errors
 */

require('dotenv').config({ path: '.env.local' })

async function testLogin() {
  console.log('🔐 Testing Login with Dummy Credentials...\n')

  const testCredentials = [
    {
      email: 'admin@rdms.com',
      password: 'admin123',
      role: 'admin',
    },
    {
      email: 'john@rdms.com',
      password: 'password123',
      role: 'user',
    },
  ]

  for (const cred of testCredentials) {
    console.log(`Testing login for: ${cred.email} (${cred.role})`)
    
    try {
      // Test the login API endpoint
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cred.email,
          password: cred.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`❌ Login failed for ${cred.email}:`)
        console.error(`   Status: ${response.status}`)
        console.error(`   Error: ${data.error || 'Unknown error'}`)
        console.error(`   Full response:`, JSON.stringify(data, null, 2))
      } else {
        console.log(`✅ Login successful for ${cred.email}`)
        console.log(`   User ID: ${data.user?.id}`)
        console.log(`   Name: ${data.user?.name}`)
        console.log(`   Role: ${data.user?.role}\n`)
      }
    } catch (error) {
      console.error(`❌ Network error testing ${cred.email}:`)
      console.error(`   ${error.message}`)
      console.error(`   Make sure the dev server is running: npm run dev\n`)
    }
  }
}

// Check if server is running first
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test', password: 'test' }),
}).then(() => {
  testLogin()
}).catch(() => {
  console.log('⚠️  Dev server not running. Starting test anyway...\n')
  testLogin()
})




