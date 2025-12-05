# Quick Database Setup Guide

## ⚡ Fast Setup (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Copy the SQL Script
1. Open `supabase-setup.sql` file in this project
2. Select ALL content (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)

### Step 3: Paste and Run
1. Paste into the Supabase SQL Editor
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait for "Success" message

### Step 4: Verify
1. Go to **"Table Editor"** in Supabase
2. You should see 5 tables:
   - ✅ users
   - ✅ documents
   - ✅ categories
   - ✅ document_versions
   - ✅ system_logs

### Step 5: Test
1. Go to http://localhost:3000/test-db
2. Click "Run Database Test"
3. All tables should show ✅ Accessible

## 🔧 If You Get Errors

### Error: "relation already exists"
- Some tables might already exist
- The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again
- If you want to start fresh, drop tables first (be careful!)

### Error: "permission denied"
- Make sure you're logged into Supabase
- Use the SQL Editor (not Table Editor)
- Check you have admin access to the project

### Error: "syntax error"
- Make sure you copied the ENTIRE script
- Don't modify anything
- Try copying again from the file

## 📋 Manual Table Creation (if script fails)

If the full script doesn't work, create tables one by one in this order:

1. **users** (first - no dependencies)
2. **categories** (second - no dependencies)
3. **documents** (third - depends on users and categories)
4. **document_versions** (fourth - depends on documents and users)
5. **system_logs** (fifth - depends on users)

Then run the rest of the script (indexes, RLS, triggers).

## ✅ Verification Query

Run this in Supabase SQL Editor to check if all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'documents', 'categories', 'document_versions', 'system_logs')
ORDER BY table_name;
```

Should return 5 rows.

