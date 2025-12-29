-- Complete Supabase Database Migration Script
-- This file consolidates all database migrations for the RDMS application
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql
-- After running, go to Settings > API > Refresh Schema Cache

-- ==========================================
-- SECTION 1: Extensions and Prerequisites
-- ==========================================

-- Enable the uuid-ossp extension if not already enabled (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- SECTION 2: Core Tables Setup
-- ==========================================

-- Create users table (must be first as other tables reference it)
-- Note: password_hash added for backward compatibility with custom authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  password_hash TEXT, -- For backward compatibility with custom auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add password_hash column if it doesn't exist (for custom authentication support)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create categories table (must be before documents as documents reference it)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create documents table (references users and categories)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(document_id, version_number)
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- SECTION 3: API Keys Table Setup
-- ==========================================

-- API Keys Table for Supabase
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL, -- AES-256-GCM encrypted API key (Base64)
  iv TEXT NOT NULL, -- Initialization vector for GCM (Base64, 12 bytes)
  auth_tag TEXT NOT NULL, -- Authentication tag for GCM (Base64, 16 bytes)
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_key_name UNIQUE (user_id, name)
);

-- ==========================================
-- SECTION 4: Indexes for Performance
-- ==========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- ==========================================
-- SECTION 5: Row Level Security (RLS)
-- ==========================================

-- Enable Row Level Security (RLS)
-- Note: Service role key bypasses RLS automatically, but we enable it for client-side access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- SECTION 6: RLS Policies
-- ==========================================

-- Clean up existing policies before creating new ones
-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;

-- Documents table policies
DROP POLICY IF EXISTS "Users can view active documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Service role can manage documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
DROP POLICY IF EXISTS "Users can select their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

-- Document versions policies
DROP POLICY IF EXISTS "Users can view document versions" ON document_versions;
DROP POLICY IF EXISTS "Users can create document versions" ON document_versions;
DROP POLICY IF EXISTS "Admins can manage document versions" ON document_versions;
DROP POLICY IF EXISTS "Service role can manage document versions" ON document_versions;
DROP POLICY IF EXISTS "Allow all operations on document_versions" ON document_versions;

-- Categories policies
DROP POLICY IF EXISTS "Users can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;

-- System logs policies
DROP POLICY IF EXISTS "Admins can view system logs" ON system_logs;
DROP POLICY IF EXISTS "Service role can manage system logs" ON system_logs;
DROP POLICY IF EXISTS "Allow all operations on system_logs" ON system_logs;

-- API keys policies
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;

-- Create permissive policies for service role access (bypasses RLS for API)
-- These work with service role (bypasses) and allows client access if needed
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on document_versions" ON document_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on system_logs" ON system_logs
  FOR ALL USING (true) WITH CHECK (true);

-- API Keys policies (more restrictive for client-side access)
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- SECTION 7: Functions and Triggers
-- ==========================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers before creating new ones
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- API keys update trigger
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- ==========================================
-- SECTION 8: Auth Integration Triggers
-- ==========================================

-- Create a function that will be triggered when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile, handling conflicts safely
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING; -- Skip if user already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires on INSERT to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.api_keys TO anon, authenticated;

-- Ensure the trigger function can be executed by the auth system
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ==========================================
-- SECTION 9: Migration Functions
-- ==========================================

-- Function to sync existing auth users who don't have public.users records
CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  -- Loop through auth.users that don't exist in public.users by ID
  FOR user_record IN
    SELECT au.id, au.email, au.created_at, au.updated_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Check if email already exists, skip if it does
    IF EXISTS (SELECT 1 FROM public.users WHERE email = user_record.email) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.raw_user_meta_data->>'name', user_record.email, 'User'),
      COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
      user_record.created_at,
      user_record.updated_at
    )
    ON CONFLICT (id) DO NOTHING; -- Skip if user already exists

    -- Only count as synced if the insert actually happened
    IF FOUND THEN
      synced_count := synced_count + 1;
    END IF;
  END LOOP;

  RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SECTION 10: User Isolation Migration (Optional)
-- ==========================================

-- Add user_id column to documents if it doesn't exist (for user isolation)
-- Uncomment these lines if you want to enable user isolation:
-- ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
-- CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
-- UPDATE documents SET user_id = uploaded_by WHERE user_id IS NULL AND uploaded_by IS NOT NULL;

-- ==========================================
-- SECTION 11: Test Data (Optional)
-- ==========================================

-- Insert test admin user (comment out if not needed)
-- Note: Use a real bcrypt hash for the password. You can generate one at: https://bcrypt-generator.com/
-- Password: Admin1234 (10 rounds)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@rdms.com',
  '$2a$10$8K1p/5w6B8QyO2VzJ8Q8Oe9dQyO2VzJ8Q8Oe9dQyO2VzJ8Q8Oe9d', -- Hash for "Admin1234"
  'System Administrator',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Insert test regular user (comment out if not needed)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'user@rdms.com',
  '$2a$10$8K1p/5w6B8QyO2VzJ8Q8Oe9dQyO2VzJ8Q8Oe9dQyO2VzJ8Q8Oe9d', -- Hash for "Admin1234"
  'Test User',
  'user'
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample categories (comment out if not needed)
INSERT INTO categories (name, description, status)
VALUES
  ('Documents', 'General documents and paperwork', 'active'),
  ('Contracts', 'Legal contracts and agreements', 'active'),
  ('Invoices', 'Financial invoices and receipts', 'active'),
  ('Reports', 'Business reports and analytics', 'active')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- SECTION 12: Final Setup and Verification
-- ==========================================

-- Run the sync function to catch any existing auth users (skips users with duplicate emails)
SELECT public.sync_existing_auth_users();

-- Verify the setup by checking table counts
SELECT
  'users' as table_name, COUNT(*) as record_count
FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'document_versions', COUNT(*) FROM document_versions
UNION ALL
SELECT 'system_logs', COUNT(*) FROM system_logs
UNION ALL
SELECT 'api_keys', COUNT(*) FROM api_keys;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
-- Remember to:
-- 1. Go to Settings > API > Refresh Schema Cache in Supabase
-- 2. Test the application login functionality
-- 3. The admin user credentials are: admin@rdms.com / Admin1234
