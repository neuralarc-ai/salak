/**
 * Debug Login Database Issues
 * Tests database connectivity and queries for login troubleshooting
 * Run with: node scripts/debug-login-db.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')

async function debugLoginDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 Login Database Debug Tool')
  console.log('=' .repeat(50))

  console.log('1. Environment Check:')
  console.log('   Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing')
  console.log('   Service Key:', supabaseServiceKey ? '✅ Present (length: ' + supabaseServiceKey.length + ')' : '❌ Missing')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n2. Client Creation: ✅ Supabase client created')

  // Test 1: Basic connectivity
  console.log('\n3. Basic Connectivity Test:')
  try {
    const start = Date.now()
    const { data, error } = await supabase.from('users').select('id').limit(1)
    const end = Date.now()

    console.log(`   Query time: ${end - start}ms`)
    console.log(`   Success: ${!error}`)
    if (error) {
      console.log(`   Error: ${error.message}`)
      console.log(`   Code: ${error.code}`)
      console.log(`   Details: ${error.details}`)
      console.log(`   Hint: ${error.hint}`)
    } else {
      console.log(`   Data received: ${!!data}`)
    }
  } catch (err) {
    console.log(`   Exception: ${err.message}`)
  }

  // Test 2: Table schema check
  console.log('\n4. Users Table Schema Check:')
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    })

    if (error) {
      console.log(`   ❌ Schema query failed: ${error.message}`)
      console.log(`   Try running this SQL manually in Supabase:`)
      console.log(`   SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';`)
    } else {
      console.log(`   ✅ Schema retrieved (${data?.length || 0} columns):`)
      data?.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`)
      })

      const hasPasswordHash = data?.some(col => col.column_name === 'password_hash')
      console.log(`   Password hash column: ${hasPasswordHash ? '✅ Present' : '❌ Missing'}`)
    }
  } catch (err) {
    console.log(`   Exception during schema check: ${err.message}`)
  }

  // Test 3: User lookup test
  console.log('\n5. User Lookup Test (admin@rdms.com):')
  const testEmail = 'admin@rdms.com'
  try {
    const start = Date.now()
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', testEmail)
      .maybeSingle()
    const end = Date.now()

    console.log(`   Query time: ${end - start}ms`)
    console.log(`   Success: ${!error}`)
    if (error) {
      console.log(`   Error: ${error.message}`)
      console.log(`   Code: ${error.code}`)
    } else {
      console.log(`   User found: ${!!data}`)
      if (data) {
        console.log(`   ID: ${data.id}`)
        console.log(`   Email: ${data.email}`)
        console.log(`   Name: ${data.name}`)
        console.log(`   Role: ${data.role}`)
        console.log(`   Has password hash: ${!!data.password_hash}`)
      }
    }
  } catch (err) {
    console.log(`   Exception: ${err.message}`)
  }

  // Test 4: RLS bypass test
  console.log('\n6. RLS Bypass Test:')
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `SELECT id, email, name, role FROM users WHERE email = '${testEmail}' LIMIT 1;`
    })

    console.log(`   Success: ${!error}`)
    if (error) {
      console.log(`   Error: ${error.message}`)
      console.log(`   Code: ${error.code}`)
    } else {
      console.log(`   Data received: ${!!data}`)
      if (data && data.length > 0) {
        console.log(`   User data:`, data[0])
      }
    }
  } catch (err) {
    console.log(`   Exception: ${err.message}`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🔍 Debug complete. Check the output above for issues.')
}

// Run the debug function
debugLoginDatabase().catch(console.error)
