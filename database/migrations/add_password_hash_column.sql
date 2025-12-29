-- Add password_hash column for custom authentication support
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'password_hash';

