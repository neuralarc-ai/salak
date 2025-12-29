# 🔄 Refresh Supabase Schema Cache

## Quick Method: Run SQL Command

1. **Go to Supabase SQL Editor** (should be open in your browser)
2. **Click "New query"**
3. **Copy and paste this SQL command:**

```sql
NOTIFY pgrst, 'reload schema';
```

4. **Click "Run"** (or press Ctrl+Enter)
5. **Wait 30-60 seconds**
6. **Test your connection**

## Alternative: Use Dashboard

1. Go to **Settings** (gear icon)
2. Click **API**
3. Scroll to **Schema Cache** section
4. Click **"Refresh Schema Cache"** or **"Reload Schema"**
5. Wait 30-60 seconds

## Test After Refresh

```bash
cd frontend
npm run test:db
```

You should see:
```
✅ All required tables are accessible!
✅ Database is ready!
```





