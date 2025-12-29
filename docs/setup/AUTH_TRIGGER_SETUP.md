# Supabase Auth Trigger Setup

## Problem Solved

Previously, when users signed up through Supabase Auth, they were only created in the `auth.users` table but not in the `public.users` table. This caused issues where users could sign up successfully but not appear in the application's user management system.

## Solution: Database Trigger

This solution implements a **database trigger** that automatically creates a record in `public.users` whenever a new user signs up through Supabase Auth. This follows Supabase best practices and ensures data consistency.

## How It Works

1. **User signs up** → Supabase Auth creates record in `auth.users`
2. **Trigger fires** → Automatically creates matching record in `public.users`
3. **Application works** → User can login and access all features

## Setup Instructions

### 1. Run the Setup Script

```bash
cd frontend
node scripts/setup-auth-trigger.js
```

This will display the SQL you need to execute.

### 2. Execute SQL in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste the SQL from the setup script
6. Click **"Run"**

### 3. Verify Setup

The SQL creates:
- ✅ **Trigger function** (`handle_new_user`)
- ✅ **Database trigger** (`on_auth_user_created`)
- ✅ **Proper permissions** for the trigger
- ✅ **Sync function** for existing users (optional)

## What Changed

### Before (Manual Insertion)
```typescript
// Old approach - manually insert into public.users
const password_hash = await bcrypt.hash(password, 10)
await supabase.from('users').insert({
  email, password_hash, name, role
})
```

### After (Trigger-Based)
```typescript
// New approach - use Supabase Auth, trigger handles the rest
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: {
    data: { name, role }
  }
})
// Trigger automatically creates public.users record
```

## Benefits

- ✅ **Automatic**: No manual database operations needed
- ✅ **Consistent**: Every auth signup creates a user profile
- ✅ **Reliable**: Database-level trigger ensures consistency
- ✅ **Best Practice**: Follows Supabase Auth patterns
- ✅ **Maintainable**: No duplicate user creation logic

## Testing

### Test New User Registration
1. Go to `/signup` page
2. Create a new account
3. Verify user appears in both:
   - `auth.users` table
   - `public.users` table
4. Test login functionality

### Sync Existing Users (Optional)
If you have existing auth users without public profiles:

```sql
-- Run this in Supabase SQL Editor
SELECT public.sync_existing_auth_users();
```

## Troubleshooting

### Trigger Not Working
1. **Check trigger exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Check function exists**:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
   ```

3. **Check permissions**:
   ```sql
   SELECT * FROM information_schema.role_table_grants
   WHERE table_name = 'users' AND grantee IN ('anon', 'authenticated');
   ```

### Manual User Creation
If needed, you can still create admin users manually:

```bash
cd frontend
node scripts/create-admin-user.js
```

## Migration Notes

- **Existing users**: Will continue to work normally
- **New registrations**: Now use Supabase Auth + trigger
- **Admin creation**: Still uses manual insertion (by design)
- **Login**: Unchanged - still checks `public.users` table

## Security

- ✅ **Service role permissions**: Trigger runs with proper permissions
- ✅ **Data validation**: Trigger validates required fields
- ✅ **RLS bypassed**: Service role key bypasses RLS policies
- ✅ **No client exposure**: Trigger logic is server-side only

## Schema Changes

The trigger creates `public.users` records with:
- `id`: From `auth.users.id` (UUID)
- `email`: From `auth.users.email`
- `name`: From `auth.users.raw_user_meta_data.name`
- `role`: From `auth.users.raw_user_meta_data.role` (defaults to 'user')
- `created_at`: From `auth.users.created_at`
- `updated_at`: From `auth.users.updated_at`

This ensures complete synchronization between auth and profile data.


