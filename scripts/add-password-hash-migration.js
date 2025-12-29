/**
 * Migration Script: Add password_hash column to users table
 * Run with: node scripts/add-password-hash-migration.js
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔄 Running password_hash column migration...\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add-password-hash-column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands and execute them
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim().startsWith('--') || command.trim() === '') continue;

      console.log(`Executing: ${command.trim().substring(0, 50)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command.trim() + ';' });
        if (error) {
          console.log(`Warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`Note: RPC execution may not work in all Supabase environments`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('📋 Note: If the above commands didn\'t execute, please run this SQL manually in Supabase:');
    console.log(migrationSQL);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash for custom authentication (optional, used alongside Supabase Auth)';
    `);
  }
}

runMigration().catch(console.error);
