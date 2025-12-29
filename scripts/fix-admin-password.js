/**
 * Fix Admin Password - Add password_hash to existing admin user
 * Run with: node scripts/fix-admin-password.js
 */

require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
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

  console.log('🔧 Fixing admin user password...\n');

  const adminEmail = 'admin@rdms.com';
  const adminPassword = 'Admin1234';

  try {
    // Hash the password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Update existing admin user with password hash
    console.log('Updating admin user with password hash...');
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', adminEmail)
      .select('id, email, name, role');

    if (error) {
      console.error('❌ Update failed:', error.message);

      if (error.message.includes('password_hash')) {
        console.log('\n🔧 MANUAL SQL REQUIRED: The password_hash column does not exist.');
        console.log('\nPlease run this SQL in your Supabase SQL Editor:');
        console.log('ALTER TABLE users ADD COLUMN password_hash TEXT;');
        console.log('\nThen re-run this script.');
        process.exit(1);
      }

      throw error;
    }

    if (!data || data.length === 0) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('✅ Admin user updated successfully!');
    console.log('📋 Admin Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${data[0].role}`);
    console.log(`   ID: ${data[0].id}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminPassword().catch(console.error);