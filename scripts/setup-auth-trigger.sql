-- Supabase Auth Trigger Setup
-- This script creates a database trigger that automatically populates the public.users table
-- when new users sign up through Supabase Auth

-- Enable the uuid-ossp extension if not already enabled (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
-- The trigger function needs to be able to insert into public.users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Ensure the trigger function can be executed by the auth system
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Optional: Create a function to sync existing auth users who don't have public.users records
-- This can be run manually if needed to sync existing users
CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  -- Loop through auth.users that don't exist in public.users
  FOR user_record IN
    SELECT au.id, au.email, au.created_at, au.updated_at, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
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

-- Run the sync function to catch any existing users
SELECT public.sync_existing_auth_users();
