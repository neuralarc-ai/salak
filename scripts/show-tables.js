/**
 * Show All Tables in Database
 * Lists all tables and their record counts
 * Run with: cd frontend && node scripts/show-tables.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')

async function showTables() {
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

  console.log('\n📊 Database Tables Overview\n')
  console.log('='.repeat(60))

  // Get all tables by checking known tables
  try {

    // If RPC doesn't work, try direct queries to known tables
    const knownTables = [
      'users',
      'documents',
      'categories',
      'document_versions',
      'system_logs',
    ]

    console.log('\n🔍 Checking Tables...\n')

    const tableInfo = []

    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          if (error.code === 'PGRST116' || error.code === 'PGRST205') {
            tableInfo.push({
              name: tableName,
              exists: false,
              records: 0,
              error: error.code === 'PGRST116' ? 'Table not found' : 'Schema cache issue',
            })
          } else {
            tableInfo.push({
              name: tableName,
              exists: false,
              records: 0,
              error: error.message,
            })
          }
        } else {
          // Get actual count
          let actualCount = count || 0
          try {
            const countResult = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })
            actualCount = countResult.count || count || 0
          } catch (countErr) {
            // Use the count from first query
            actualCount = count || 0
          }

          tableInfo.push({
            name: tableName,
            exists: true,
            records: actualCount,
            error: null,
          })
        }
      } catch (err) {
        tableInfo.push({
          name: tableName,
          exists: false,
          records: 0,
          error: err.message,
        })
      }
    }

    // Display results
    console.log('📋 Tables in Database:\n')

    let hasTables = false
    for (const info of tableInfo) {
      if (info.exists) {
        hasTables = true
        console.log(`✅ ${info.name.padEnd(25)} - ${info.records} record(s)`)
      } else {
        if (info.error === 'Schema cache issue') {
          console.log(`⚠️  ${info.name.padEnd(25)} - Schema cache needs refresh`)
        } else {
          console.log(`❌ ${info.name.padEnd(25)} - ${info.error || 'Not found'}`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))

    // Show sample data from each table
    console.log('\n📄 Sample Data from Tables:\n')

    for (const info of tableInfo) {
      if (info.exists && info.records > 0) {
        try {
          const { data, error } = await supabase
            .from(info.name)
            .select('*')
            .limit(3)

          if (!error && data && data.length > 0) {
            console.log(`\n${info.name.toUpperCase()} (showing first ${Math.min(3, data.length)} of ${info.records}):`)
            console.log('-'.repeat(60))
            
            data.forEach((row, index) => {
              console.log(`\nRecord ${index + 1}:`)
              Object.keys(row).forEach(key => {
                const value = row[key]
                const displayValue = typeof value === 'object' ? JSON.stringify(value) : value
                const truncated = String(displayValue).length > 50 
                  ? String(displayValue).substring(0, 50) + '...' 
                  : displayValue
                console.log(`  ${key.padEnd(20)}: ${truncated}`)
              })
            })
          }
        } catch (err) {
          console.log(`\n⚠️  Could not fetch sample data from ${info.name}: ${err.message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n💡 Tips:')
    if (!hasTables) {
      console.log('   - No tables found. Run the SQL setup script in Supabase SQL Editor.')
    } else {
      console.log('   - All tables are accessible!')
      console.log('   - To see more data, use Supabase Table Editor or SQL Editor.')
    }
    console.log('   - View in Supabase: https://app.supabase.com → Table Editor\n')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('   Stack:', error.stack)
  }
}

showTables().catch(console.error)

