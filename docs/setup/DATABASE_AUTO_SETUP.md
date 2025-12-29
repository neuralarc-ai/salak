# Automatic Database Setup

## Overview

The project now includes automatic database checking that runs when you start the development server. This ensures your database is properly set up before using the application.

## How It Works

### Automatic Checks

When you run `npm run dev` or `npm run build`, the system automatically:

1. ✅ Checks if all required tables exist
2. ✅ Detects schema cache issues
3. ✅ Provides setup instructions if tables are missing
4. ✅ Shows the SQL script location

### What Happens on Startup

```
🚀 Auto Database Setup Check

🔍 Checking database tables...

✅ users: Ready
✅ documents: Ready
✅ categories: Ready
✅ document_versions: Ready
✅ system_logs: Ready

✅ All database tables are ready!
```

If tables are missing, you'll see:
```
⚠️  DATABASE SETUP REQUIRED

   Missing tables: users, documents, ...

📋 QUICK SETUP:
   → Visit: http://localhost:3000/db-init
   → Copy the SQL script
   → Run in Supabase SQL Editor
```

## Setup Options

### Option 1: Web Interface (Easiest)

1. Start your dev server: `npm run dev`
2. Visit: **http://localhost:3000/db-init**
3. You'll see:
   - Table status
   - SQL script ready to copy
   - Step-by-step instructions
4. Copy the SQL script
5. Run it in Supabase SQL Editor
6. Refresh schema cache

### Option 2: Command Line

```bash
# Show SQL script
npm run setup:db

# Copy the SQL script shown
# Then run it in Supabase SQL Editor
```

### Option 3: Manual

1. Open `frontend/supabase-setup.sql`
2. Copy all contents
3. Go to Supabase SQL Editor
4. Paste and run

## Database Initialization Page

Visit **http://localhost:3000/db-init** for:

- ✅ Real-time table status
- ✅ SQL script with copy button
- ✅ Step-by-step instructions
- ✅ Refresh status button

## API Endpoint

You can also check database status via API:

```bash
# Check status
curl http://localhost:3000/api/db/init

# Get setup instructions
curl -X POST http://localhost:3000/api/db/init
```

## Troubleshooting

### Schema Cache Error (PGRST205)

If you see this error, refresh the schema cache:

1. Go to Supabase Dashboard
2. Settings > API
3. Click "Refresh Schema Cache" or "Reload Schema"
4. Wait 10-30 seconds
5. Try again

### Tables Not Found (PGRST116)

If tables don't exist:

1. Visit `/db-init` page
2. Copy the SQL script
3. Run in Supabase SQL Editor
4. Refresh schema cache

### Automatic Detection

The system automatically detects:
- Missing tables
- Schema cache issues
- Connection problems

And provides helpful error messages with links to setup pages.

## Commands

- `npm run dev` - Automatically checks database before starting
- `npm run db:check` - Manually check database status
- `npm run setup:db` - Show SQL setup script
- `npm run setup:verify` - Verify all tables exist

## Next Steps

After tables are created:

1. ✅ Tables will be automatically detected on next startup
2. ✅ You can start using sign up/login
3. ✅ All API endpoints will work
4. ✅ Frontend pages will connect to real data

The system is designed to guide you through setup automatically!

