# Supabase Setup Guide

## Required Credentials

You need the following credentials from your Supabase project:

1. **Project URL**: Found in Settings > API > Project URL
   - Format: `https://xxxxxxxxxxxxx.supabase.co`

2. **Anon/Public Key**: Found in Settings > API > Project API keys > anon public
   - This is safe to expose in client-side code

3. **Service Role Key**: Found in Settings > API > Project API keys > service_role
   - ⚠️ **KEEP THIS SECRET** - Only use in server-side API routes
   - This key has admin privileges and bypasses Row Level Security (RLS)

## Setup Steps

### 1. Create Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Run Database Setup

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the SQL script to create tables, indexes, and RLS policies

### 3. Create Initial Admin User

You have two options:

#### Option A: Use the Register API (Recommended)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rdms.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

#### Option B: Manual SQL Insert
1. Hash your password using bcrypt (10 rounds)
   - Use: https://bcrypt-generator.com/
   - Or: `bcrypt.hash('admin123', 10)` in Node.js
2. Insert into database:
```sql
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@rdms.com', '$2a$10$YOUR_BCRYPT_HASH_HERE', 'Admin User', 'admin');
```

### 4. Install Dependencies

```bash
cd frontend
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (TEXT, Unique)
- `password_hash` (TEXT)
- `name` (TEXT)
- `role` (TEXT: 'user' | 'admin')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Documents Table
- `id` (UUID, Primary Key)
- `name` (TEXT)
- `description` (TEXT)
- `file_path` (TEXT)
- `file_size` (BIGINT)
- `file_type` (TEXT)
- `category_id` (UUID, Foreign Key)
- `uploaded_by` (UUID, Foreign Key)
- `status` (TEXT: 'active' | 'archived' | 'deleted')
- `tags` (TEXT[])
- `version` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Categories Table
- `id` (UUID, Primary Key)
- `name` (TEXT, Unique)
- `description` (TEXT)
- `status` (TEXT: 'active' | 'inactive')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### System Logs Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `action` (TEXT)
- `resource` (TEXT)
- `status` (TEXT: 'success' | 'failed')
- `ip_address` (TEXT)
- `created_at` (TIMESTAMP)

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only view their own profile
- Admins have full access to all tables
- Service Role Key should NEVER be exposed to the client
- Always use environment variables for sensitive data

## Testing

After setup, you can test the login with:
- Email: `admin@rdms.com`
- Password: `admin123` (or whatever you set)

