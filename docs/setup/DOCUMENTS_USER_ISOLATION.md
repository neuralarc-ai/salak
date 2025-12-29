# Documents User Isolation Fix

## Overview
This fix ensures that users can only see and manage their own documents, preventing unauthorized access to other users' documents.

## Changes Made

### 1. Database Migration
Run the migration script: `frontend/supabase-documents-user-isolation.sql`

This script:
- Adds `user_id` column to `documents` table
- Populates `user_id` from `uploaded_by` for existing records
- Creates index on `user_id` for better query performance
- Enables Row-Level Security (RLS)
- Creates RLS policies for SELECT, INSERT, UPDATE, DELETE operations

### 2. Code Changes

#### Frontend Routes (`frontend/app/api/documents/`)
- **GET /documents**: Added filter to only return documents where `user_id = user.id` OR `uploaded_by = user.id`
- **POST /documents**: Sets both `user_id` and `uploaded_by` when creating documents
- **GET /documents/[id]**: Filters by user before returning document
- **PUT /documents/[id]**: Checks user ownership before allowing updates
- **DELETE /documents/[id]**: Checks user ownership before allowing deletion

#### Backend Routes (`backend/api/documents/`)
- Same changes as frontend routes for consistency

### 3. Security Layers

1. **Application-Level Filtering**: All queries filter by `user_id` or `uploaded_by`
2. **Database-Level Security**: RLS policies enforce user isolation at the database level
3. **Permission Checks**: Additional checks in UPDATE/DELETE operations

## Verification Steps

1. **Run the migration script** in Supabase SQL Editor
2. **Sign up a new user** and create some documents
3. **Sign in as a different user** and verify:
   - Cannot see other user's documents in the list
   - Cannot access other user's documents by ID
   - Cannot update other user's documents
   - Cannot delete other user's documents
4. **Check database** - verify `user_id` column exists and is populated

## Notes

- The migration maintains backward compatibility by checking both `user_id` and `uploaded_by`
- Admins can still see all documents (if admin role is configured)
- RLS policies allow admins to bypass user restrictions

