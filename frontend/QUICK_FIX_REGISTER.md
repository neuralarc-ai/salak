# Quick Fix for "Failed to create user" Error

## The Problem
You're getting a 500 error when trying to sign up. This is usually caused by RLS (Row Level Security) policies blocking the insert.

## ✅ Solution: Fix RLS Policies

### Step 1: Run This SQL in Supabase

Go to Supabase SQL Editor and run:

```sql
-- Fix users table RLS policy (THIS IS THE FIX!)
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);
```

### Step 2: Refresh Schema Cache

1. Go to Supabase Dashboard
2. Settings > API
3. Click "Refresh Schema Cache" or "Reload Schema"
4. Wait 30 seconds

### Step 3: Test Again

Try signing up again. It should work now!

## 🔍 Alternative: Disable RLS Temporarily (For Testing)

If you want to test without RLS:

```sql
-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**Note:** Re-enable it after testing:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 🐛 Still Not Working?

1. **Check the terminal logs** - Look for detailed error messages
2. **Verify service role key** - Make sure `.env.local` has the correct `SUPABASE_SERVICE_ROLE_KEY`
3. **Test the endpoint** - Visit `http://localhost:3000/api/test/register` to see detailed error info
4. **Check Supabase logs** - Go to Supabase Dashboard > Logs to see database errors

## 📋 Complete Fix Script

Run this complete script in Supabase SQL Editor:

```sql
-- Fix all RLS policies
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage document_versions" ON document_versions;
DROP POLICY IF EXISTS "Allow all operations on document_versions" ON document_versions;
CREATE POLICY "Allow all operations on document_versions" ON document_versions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage system_logs" ON system_logs;
DROP POLICY IF EXISTS "Allow all operations on system_logs" ON system_logs;
CREATE POLICY "Allow all operations on system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);
```

Then refresh schema cache and try again!

