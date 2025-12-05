-- Fix RLS Policies for RDMS
-- Run this in Supabase SQL Editor if you're getting "Failed to create user" errors

-- Fix users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Fix documents table policies
DROP POLICY IF EXISTS "Users can view active documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Service role can manage documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;

CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

-- Fix document_versions table policies
DROP POLICY IF EXISTS "Users can view document versions" ON document_versions;
DROP POLICY IF EXISTS "Users can create document versions" ON document_versions;
DROP POLICY IF EXISTS "Admins can manage document versions" ON document_versions;
DROP POLICY IF EXISTS "Service role can manage document versions" ON document_versions;
DROP POLICY IF EXISTS "Allow all operations on document_versions" ON document_versions;

CREATE POLICY "Allow all operations on document_versions" ON document_versions
  FOR ALL USING (true) WITH CHECK (true);

-- Fix categories table policies
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- Fix system_logs table policies
DROP POLICY IF EXISTS "Admins can view system logs" ON system_logs;
DROP POLICY IF EXISTS "Service role can manage system logs" ON system_logs;
DROP POLICY IF EXISTS "Allow all operations on system_logs" ON system_logs;

CREATE POLICY "Allow all operations on system_logs" ON system_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

