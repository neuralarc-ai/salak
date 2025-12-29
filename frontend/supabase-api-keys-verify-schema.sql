-- Verification script for api_keys table schema
-- Run this in your Supabase SQL Editor to verify the table structure

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'api_keys'
) AS table_exists;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- Check for NULL values in required encryption columns (should return 0 rows)
SELECT 
  id,
  name,
  CASE 
    WHEN encrypted_key IS NULL THEN 'encrypted_key is NULL'
    WHEN iv IS NULL THEN 'iv is NULL'
    WHEN auth_tag IS NULL THEN 'auth_tag is NULL'
    ELSE 'OK'
  END AS issue
FROM api_keys
WHERE encrypted_key IS NULL 
   OR iv IS NULL 
   OR auth_tag IS NULL;

-- Count total records
SELECT COUNT(*) AS total_api_keys FROM api_keys;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'api_keys'
  AND schemaname = 'public';

