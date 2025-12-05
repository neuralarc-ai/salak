# Quick Table Setup Guide

## ⚡ Fast Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: **https://app.supabase.com**
2. Select your project
3. Click **"SQL Editor"** in the left sidebar (it looks like a database icon)
4. Click **"New query"** button (top right)

### Step 2: Copy the SQL Script

**Option A: From Terminal**
```bash
cd frontend
npm run setup:db
```
This will display the SQL script. Copy it all.

**Option B: From File**
Open `frontend/supabase-setup.sql` and copy all contents.

**Option C: From Web Interface**
1. Start your dev server: `npm run dev`
2. Visit: **http://localhost:3000/db-init**
3. Click **"Copy SQL"** button

### Step 3: Run the SQL Script

1. Paste the SQL script into the Supabase SQL Editor
2. Click **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
3. Wait for the success message: ✅ "Success. No rows returned"

### Step 4: Refresh Schema Cache

1. In Supabase Dashboard, go to **Settings** (gear icon)
2. Click **"API"** in the settings menu
3. Scroll down and find **"Reload Schema"** or **"Refresh Schema Cache"**
4. Click it
5. Wait 10-30 seconds

### Step 5: Verify Tables

**Option A: In Supabase Dashboard**
1. Click **"Table Editor"** in left sidebar
2. You should see 5 tables:
   - `users`
   - `documents`
   - `categories`
   - `document_versions`
   - `system_logs`

**Option B: Via Command**
```bash
npm run setup:verify
```

**Option C: Via Web**
Visit: http://localhost:3000/db-init

## ✅ Done!

After setup, you can:
- Sign up new users
- Login
- Upload documents
- Use all features

## 🐛 Troubleshooting

### Error: "relation already exists"
- Tables already exist, you're good to go!
- Skip to Step 4 (refresh schema cache)

### Error: "permission denied"
- Make sure you're using the correct Supabase project
- Check you have admin access to the project

### Tables created but still getting errors
- **Refresh the schema cache** (Step 4 is critical!)
- Wait 1-2 minutes after refreshing
- Try again

### Still having issues?
Visit: http://localhost:3000/db-init for detailed status

