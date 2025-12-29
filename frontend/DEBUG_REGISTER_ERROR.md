# Debug Register 500 Error

## Check These Things:

### 1. Check Server Terminal Logs
Look at your terminal where `npm run dev` is running. You should see detailed error logs like:
```
Registration error details: { ... }
Full registration error: { ... }
```

### 2. Check Browser Console
Open browser DevTools (F12) and check the Console tab for error details.

### 3. Test the API Directly
Run this in terminal:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

### 4. Check Environment Variables
Make sure `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Most Common Issues:

#### A. RLS Policy Issue
**Fix:** Run this in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);
```

#### B. Schema Cache Issue
**Fix:** 
1. Go to Supabase Dashboard > Settings > API
2. Click "Refresh Schema Cache"
3. Wait 30 seconds

#### C. Service Role Key Wrong
**Fix:** 
- Check `.env.local` has correct `SUPABASE_SERVICE_ROLE_KEY`
- Get it from: Supabase Dashboard > Settings > API > service_role key

### 6. Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in left sidebar
3. Check for database errors

### 7. Test Endpoint
Visit: `http://localhost:3000/api/test/register`
This will show detailed test results.

## Quick Fix Script

Run this complete fix in Supabase SQL Editor:

```sql
-- Fix RLS policies
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Refresh schema (if needed)
-- Then go to Settings > API > Refresh Schema Cache
```

Then refresh schema cache and try again!

