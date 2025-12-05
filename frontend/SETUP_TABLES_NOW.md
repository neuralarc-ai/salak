# 🚀 SETUP TABLES NOW - Step by Step

## You need to create tables in Supabase. Follow these steps:

### Step 1: Get the SQL Script

**Run this command:**
```bash
cd frontend
npm run setup:sql
```

This will:
- Show you the complete SQL script
- Open Supabase in your browser
- Give you step-by-step instructions

### Step 2: Copy the SQL Script

The command above will display the full SQL script. **Copy everything** from the output.

**OR** open the file directly:
```bash
cat frontend/supabase-setup.sql
```

### Step 3: Go to Supabase SQL Editor

1. Go to: **https://app.supabase.com**
2. **Select your project** (the one with your credentials)
3. Click **"SQL Editor"** in the left sidebar (database icon)
4. Click **"New query"** button (top right, green button)

### Step 4: Paste and Run SQL

1. **Paste** the entire SQL script into the editor
2. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait for the success message: ✅ **"Success. No rows returned"**

### Step 5: Refresh Schema Cache (IMPORTANT!)

1. In Supabase Dashboard, click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in the settings menu
3. Scroll down to find **"Reload Schema"** or **"Refresh Schema Cache"** button
4. **Click it**
5. **Wait 10-30 seconds** for it to refresh

### Step 6: Verify Tables Were Created

**Option A: In Supabase Dashboard**
1. Click **"Table Editor"** in left sidebar
2. You should see these 5 tables:
   - ✅ `users`
   - ✅ `documents`
   - ✅ `categories`
   - ✅ `document_versions`
   - ✅ `system_logs`

**Option B: Run verification command**
```bash
npm run setup:verify
```

**Option C: Visit web interface**
1. Start dev server: `npm run dev`
2. Visit: **http://localhost:3000/db-init**
3. Should show all tables as ✅ Ready

### Step 7: Test Sign Up

1. Visit: **http://localhost:3000/signup**
2. Create an account
3. Should work now! ✅

## 🎯 Quick Command Summary

```bash
# 1. Get SQL script (opens browser too)
npm run setup:sql

# 2. After running SQL in Supabase, verify:
npm run setup:verify

# 3. Start dev server
npm run dev
```

## ⚠️ Common Issues

### "relation already exists" error
- Tables already exist! ✅
- Just refresh schema cache (Step 5)

### Tables created but still getting errors
- **You MUST refresh schema cache** (Step 5)
- Wait 1-2 minutes after refreshing
- Try again

### Can't find "Refresh Schema Cache" button
- Look for "Reload Schema" or "Refresh Schema"
- It's in Settings > API
- If not visible, wait 2-3 minutes and try again

## ✅ Success Checklist

- [ ] SQL script copied
- [ ] SQL run in Supabase SQL Editor
- [ ] Success message received
- [ ] Schema cache refreshed
- [ ] Tables visible in Table Editor
- [ ] `npm run setup:verify` shows all ✅
- [ ] Can sign up new users

## 🆘 Still Having Issues?

1. Visit: **http://localhost:3000/db-init** for detailed status
2. Check: **http://localhost:3000/test-db** for connection test
3. Make sure your `.env.local` has correct Supabase credentials

---

**After setup, your tables will be automatically detected on every startup!** 🎉

