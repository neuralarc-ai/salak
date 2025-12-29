-- Migration: Add user_id column and Row-Level Security to documents table
-- This ensures users can only see and manage their own documents
-- Run this in your Supabase SQL Editor

-- Step 1: Add user_id column if it doesn't exist
-- We'll use uploaded_by as the source, then make user_id NOT NULL
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Populate user_id from uploaded_by for existing records
UPDATE documents 
SET user_id = uploaded_by 
WHERE user_id IS NULL AND uploaded_by IS NOT NULL;

-- Step 3: Make user_id NOT NULL (only after populating existing data)
-- Uncomment this after verifying all records have user_id:
-- ALTER TABLE documents 
--   ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Step 5: Enable Row-Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Users can select their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;

-- Step 7: Create RLS policies

-- Policy: Users can select only their own documents
CREATE POLICY "Users can select their own documents"
  ON documents
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = uploaded_by OR
    -- Admins can see all documents (if you have an admin role check)
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Users can insert only their own documents
CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    auth.uid() = uploaded_by
  );

-- Policy: Users can update only their own documents
CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Users can delete only their own documents
CREATE POLICY "Users can delete their own documents"
  ON documents
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = uploaded_by OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Verification queries (run these to check the migration)
-- SELECT COUNT(*) as total_documents FROM documents;
-- SELECT COUNT(*) as documents_with_user_id FROM documents WHERE user_id IS NOT NULL;
-- SELECT COUNT(*) as documents_without_user_id FROM documents WHERE user_id IS NULL;

