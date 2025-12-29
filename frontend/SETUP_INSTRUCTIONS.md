# Database Setup Instructions

## Step-by-Step Guide to Create Tables in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your project
4. In the left sidebar, click on **"SQL Editor"** (or go to: Project Settings → SQL Editor)

### Step 2: Open the SQL Script

1. Open the file `supabase-setup.sql` in this project
2. Copy **ALL** the contents (Ctrl+A / Cmd+A, then Ctrl+C / Cmd+C)

### Step 3: Paste and Run the SQL Script

1. In the Supabase SQL Editor, click **"New query"** (or the "+" button)
2. Paste the entire SQL script into the editor
3. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
4. Wait for the script to complete (you should see "Success. No rows returned")

### Step 4: Verify Tables Were Created

1. In Supabase, go to **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - `users`
   - `documents`
   - `categories`
   - `document_versions`
   - `system_logs`

### Step 5: Test the Connection

1. Go back to your Next.js app
2. Visit: `http://localhost:3000/test-db`
3. Click "Run Database Test"
4. All tables should now show as "Accessible"

## Troubleshooting

### If you get errors when running the SQL:

1. **"relation already exists"** - Some tables might already exist. You can either:
   - Drop existing tables first (be careful - this deletes data!)
   - Or modify the script to use `CREATE TABLE IF NOT EXISTS` (already included)

2. **"permission denied"** - Make sure you're using the SQL Editor with proper permissions

3. **"syntax error"** - Make sure you copied the entire script without any modifications

### If tables still don't appear:

1. Refresh the Supabase dashboard
2. Check the SQL Editor for any error messages
3. Try running the script in smaller chunks (each CREATE TABLE statement separately)

## Quick SQL Commands to Check Tables

Run this in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'documents', 'categories', 'document_versions', 'system_logs')
ORDER BY table_name;
```

This should return 5 rows if all tables are created successfully.

