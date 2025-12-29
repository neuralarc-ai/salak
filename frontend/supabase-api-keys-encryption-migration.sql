-- Migration: Update api_keys table to use AES-256-GCM encryption
-- Run this AFTER setting up API_KEY_ENCRYPTION_SECRET in your environment
-- 
-- This migration:
-- 1. Adds encrypted_key, iv, and auth_tag columns
-- 2. Removes the old key_hash column
-- 3. Updates indexes

-- Step 1: Add new encryption columns (nullable initially for migration)
ALTER TABLE api_keys 
  ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS auth_tag TEXT;

-- Step 2: If you have existing data, you'll need to migrate it separately
-- For now, we'll assume you're starting fresh or handling migration separately

-- Step 3: Drop the old key_hash column and its index
DROP INDEX IF EXISTS idx_api_keys_key_hash;
ALTER TABLE api_keys DROP COLUMN IF EXISTS key_hash;

-- Step 4: Make the new columns NOT NULL (only if you don't have existing data)
-- If you have existing data, migrate it first, then run:
-- ALTER TABLE api_keys 
--   ALTER COLUMN encrypted_key SET NOT NULL,
--   ALTER COLUMN iv SET NOT NULL,
--   ALTER COLUMN auth_tag SET NOT NULL;

-- Step 5: Add indexes for the new columns (optional, for faster lookups if needed)
-- Note: We don't index encrypted_key as it's encrypted and not used for lookups

