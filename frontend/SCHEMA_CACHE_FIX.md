# Fix Schema Cache Error (PGRST205)

## Problem
You're seeing this error:
```
Could not find the table 'public.users' in the schema cache
```

This happens when Supabase's PostgREST schema cache hasn't been updated after creating tables.

## Solution

### Option 1: Refresh Schema Cache in Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Go to **Settings** (gear icon in left sidebar)
4. Click on **API** in the settings menu
5. Scroll down to find **"Refresh Schema Cache"** or **"Reload Schema"** button
6. Click it to refresh the cache
7. Wait 10-30 seconds for the cache to update
8. Try your request again

### Option 2: Wait for Auto-Refresh

Supabase automatically refreshes the schema cache periodically (usually within 1-5 minutes). You can:
- Wait a few minutes
- Try the request again

### Option 3: Verify Tables Exist

1. Go to Supabase Dashboard
2. Click **Table Editor** in the left sidebar
3. Verify you can see these tables:
   - `users`
   - `documents`
   - `categories`
   - `document_versions`
   - `system_logs`

If tables don't exist, run the SQL setup script:
1. Go to **SQL Editor**
2. Copy and paste the contents of `supabase-setup.sql`
3. Click **Run**

### Option 4: Restart Supabase Project (if self-hosted)

If you're self-hosting Supabase, restart the PostgREST service:
```bash
# This will refresh the schema cache
docker-compose restart postgrest
```

## Quick Test

After refreshing the cache, test the connection:
```bash
cd frontend
npm run setup:verify
```

Or visit: http://localhost:3000/test-db

## Prevention

To avoid this issue in the future:
- After creating/modifying tables in Supabase, manually refresh the schema cache
- Or wait a few minutes before using the API
- The cache usually refreshes automatically within 1-5 minutes

