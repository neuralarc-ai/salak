# API Keys Feature Setup Guide

## Overview

The API Keys feature allows users to create, manage, and revoke API keys for secure access to the application. All keys are encrypted and never displayed after creation.

## Database Setup

### Step 1: Create the API Keys Table

1. Go to your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `frontend/supabase-api-keys-table.sql` in your project
5. Copy the entire SQL script
6. Paste it into the Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message

### Step 2: Verify Table Creation

Run this query in Supabase SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'api_keys';
```

You should see `api_keys` in the results.

## Features

### Frontend

- **Route**: `/settings/api-keys`
- **Navigation**: Available in the user dropdown menu (Profile → API Keys)
- **Sections**:
  1. **Create API Key**: Form to generate and save new API keys
  2. **Existing API Keys**: Table showing all user's API keys with status and actions

### Backend API Routes

All routes are protected with authentication middleware:

- **GET `/api/api-keys`**: Fetch all API keys for the authenticated user
  - Returns: `id`, `name`, `is_active`, `created_at`, `last_used_at`
  - Never returns the actual API key value

- **POST `/api/api-keys`**: Create a new API key
  - Body: `{ name: string, apiKey: string }`
  - Validates: name uniqueness, API key length (min 32 chars)
  - Hashes the API key before storing (bcrypt)
  - Returns: API key metadata (not the actual key)

- **DELETE `/api/api-keys/:id`**: Revoke an API key
  - Soft delete: Sets `is_active` to `false`
  - Only allows revoking own API keys
  - Cannot revoke already revoked keys

## Security Features

1. **Encryption**: All API keys are hashed using bcrypt (12 rounds) before storage
2. **No Plain Text Storage**: API keys are never stored in plain text
3. **One-Time Display**: API keys are only shown once during creation
4. **Row Level Security**: Users can only access their own API keys
5. **Authentication Required**: All routes require valid authentication
6. **Audit Logging**: All API key operations are logged

## Usage

### Creating an API Key

1. Navigate to **Settings → API Keys** (from user dropdown menu)
2. Enter a descriptive name for the key
3. Click **"Generate Key"** to create a secure random key
4. **Important**: Copy and save the key immediately - it won't be shown again
5. Click **"Save API Key"**

### Viewing API Keys

- All your API keys are listed in the "Existing API Keys" section
- Shows: Name, Status (Active/Revoked), Created Date
- **Note**: The actual API key values are never displayed

### Revoking an API Key

1. Find the API key in the list
2. Click **"Revoke"** button
3. Confirm the action
4. The key will be marked as revoked and cannot be used

## Database Schema

```sql
api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,  -- Hashed with bcrypt
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, name)
)
```

## Testing

After setup, you can test the feature:

1. Log in to the application
2. Click on your user avatar in the sidebar
3. Select **"API Keys"** from the dropdown
4. Create a test API key
5. Verify it appears in the list
6. Test revoking the key

## Notes

- API keys are user-specific (each user can only see their own keys)
- Revoked keys cannot be reactivated (create a new key instead)
- API key names must be unique per user
- Minimum API key length is 32 characters
- All operations are logged in the system_logs table

