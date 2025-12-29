-- Migration: Add password_hash column to users table
-- This migration adds support for custom authentication alongside Supabase Auth
-- Run this in your Supabase SQL Editor

-- Add password_hash column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash for custom authentication (optional, used alongside Supabase Auth)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password_hash';
