# API Documentation

All API endpoints are prefixed with `/api`. Authentication is required for all endpoints except login and register.

## Authentication

All authenticated requests must include the user information in the `Authorization` header:
```
Authorization: Bearer {"id":"user-id","email":"user@example.com","name":"User Name","role":"user"}
```

Use the `api` helper from `@/lib/api-client` for automatic authentication header handling.

---

## Auth Endpoints

### GET /api/auth/me
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer {user_json}`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user" | "admin"
  }
}
```

**Example:**
```typescript
import { api } from '@/lib/api-client'

const response = await api.get('/auth/me')
if (response.success) {
  console.log(response.user)
}
```

---

## Documents Endpoints

### POST /api/documents
Create a new document.

**Headers:**
- `Authorization: Bearer {user_json}`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Document Name",
  "description": "Optional description",
  "file_path": "/path/to/file.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "category_id": "uuid-optional",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "name": "Document Name",
    "description": "Optional description",
    "file_path": "/path/to/file.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "category_id": "uuid",
    "uploaded_by": "uuid",
    "status": "active",
    "tags": ["tag1", "tag2"],
    "version": 1,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Example:**
```typescript
const response = await api.post('/documents', {
  name: 'My Document',
  file_path: '/uploads/document.pdf',
  file_size: 1024000,
  file_type: 'application/pdf',
  category_id: 'category-uuid',
  tags: ['important', 'q1-2024']
})
```

---

### GET /api/documents
Get all documents with filtering and pagination.

**Headers:**
- `Authorization: Bearer {user_json}`

**Query Parameters:**
- `category_id` (optional): Filter by category
- `status` (optional): Filter by status (default: 'active')
- `search` (optional): Search in name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid",
      "name": "Document Name",
      "description": "Description",
      "file_path": "/path/to/file.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "category_id": "uuid",
      "uploaded_by": "uuid",
      "status": "active",
      "tags": ["tag1"],
      "version": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "categories": {
        "id": "uuid",
        "name": "Category Name",
        "description": "Category Description"
      },
      "uploader": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**Example:**
```typescript
// Get all active documents
const response = await api.get('/documents')

// Search documents
const response = await api.get('/documents?search=project&page=1&limit=20')

// Filter by category
const response = await api.get('/documents?category_id=category-uuid')
```

---

### GET /api/documents/:id
Get a specific document by ID.

**Headers:**
- `Authorization: Bearer {user_json}`

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "name": "Document Name",
    "description": "Description",
    "file_path": "/path/to/file.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "category_id": "uuid",
    "uploaded_by": "uuid",
    "status": "active",
    "tags": ["tag1"],
    "version": 1,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z",
    "categories": {
      "id": "uuid",
      "name": "Category Name",
      "description": "Category Description"
    },
    "uploader": {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com"
    }
  }
}
```

**Example:**
```typescript
const response = await api.get(`/documents/${documentId}`)
```

---

### PUT /api/documents/:id
Update a document. Users can only update their own documents. Admins can update any document.

**Headers:**
- `Authorization: Bearer {user_json}`
- `Content-Type: application/json`

**Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "category_id": "uuid",
  "tags": ["tag1", "tag2"],
  "status": "active" | "archived" | "deleted" // Admin only
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    // Updated document object
  }
}
```

**Example:**
```typescript
const response = await api.put(`/documents/${documentId}`, {
  name: 'Updated Document Name',
  description: 'New description',
  tags: ['updated', 'tag']
})
```

---

### DELETE /api/documents/:id
Delete a document (soft delete - sets status to 'deleted'). Users can only delete their own documents. Admins can delete any document.

**Headers:**
- `Authorization: Bearer {user_json}`

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Example:**
```typescript
const response = await api.delete(`/documents/${documentId}`)
```

---

## Document Versions Endpoints

### POST /api/documents/:id/version
Create a new version of a document.

**Headers:**
- `Authorization: Bearer {user_json}`
- `Content-Type: application/json`

**Body:**
```json
{
  "file_path": "/path/to/new-version.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "description": "Optional version description"
}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "id": "uuid",
    "document_id": "uuid",
    "version_number": 2,
    "file_path": "/path/to/new-version.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "description": "Version description",
    "created_by": "uuid",
    "created_at": "2024-01-15T10:00:00Z",
    "created_by": {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com"
    }
  }
}
```

**Example:**
```typescript
const response = await api.post(`/documents/${documentId}/version`, {
  file_path: '/uploads/document-v2.pdf',
  file_size: 2048000,
  file_type: 'application/pdf',
  description: 'Updated version with new content'
})
```

---

### GET /api/documents/:id/versions
Get all versions of a document.

**Headers:**
- `Authorization: Bearer {user_json}`

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "name": "Document Name"
  },
  "versions": [
    {
      "id": "uuid",
      "document_id": "uuid",
      "version_number": 2,
      "file_path": "/path/to/version.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "description": "Version description",
      "created_by": "uuid",
      "created_at": "2024-01-15T10:00:00Z",
      "created_by": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com"
      }
    }
  ]
}
```

**Example:**
```typescript
const response = await api.get(`/documents/${documentId}/versions`)
```

---

## Categories Endpoints

### GET /api/categories
Get all categories.

**Headers:**
- `Authorization: Bearer {user_json}`

**Query Parameters:**
- `status` (optional): Filter by status (default: 'active')
- `include_inactive` (optional): Include inactive categories (admin only, default: false)

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "uuid",
      "name": "Category Name",
      "description": "Category description",
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "document_count": 10
    }
  ],
  "total": 5
}
```

**Example:**
```typescript
const response = await api.get('/categories')
```

---

### POST /api/categories
Create a new category (Admin only).

**Headers:**
- `Authorization: Bearer {user_json}`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Category Name",
  "description": "Optional description",
  "status": "active" | "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "uuid",
    "name": "Category Name",
    "description": "Description",
    "status": "active",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**Example:**
```typescript
const response = await api.post('/categories', {
  name: 'New Category',
  description: 'Category description',
  status: 'active'
})
```

---

### PUT /api/categories/:id
Update a category (Admin only).

**Headers:**
- `Authorization: Bearer {user_json}`
- `Content-Type: application/json`

**Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "active" | "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    // Updated category object
  }
}
```

**Example:**
```typescript
const response = await api.put(`/categories/${categoryId}`, {
  name: 'Updated Category Name',
  status: 'inactive'
})
```

---

### DELETE /api/categories/:id
Delete a category (Admin only). Sets status to 'inactive' if category has documents.

**Headers:**
- `Authorization: Bearer {user_json}`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error Response (if category has documents):**
```json
{
  "error": "Cannot delete category: it has associated documents. Set status to inactive instead."
}
```

**Example:**
```typescript
const response = await api.delete(`/categories/${categoryId}`)
```

---

## Admin Logs Endpoints

### GET /api/admin/logs
Get system logs (Admin only).

**Headers:**
- `Authorization: Bearer {user_json}`

**Query Parameters:**
- `action` (optional): Filter by action type
- `status` (optional): Filter by status ('success' | 'failed')
- `user_id` (optional): Filter by user ID
- `start_date` (optional): Filter from date (ISO format)
- `end_date` (optional): Filter to date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 100)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action": "Document Upload",
      "resource": "document.pdf (uuid)",
      "status": "success",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:00:00Z",
      "user": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 500,
    "totalPages": 5
  }
}
```

**Example:**
```typescript
// Get all logs
const response = await api.get('/admin/logs')

// Filter by action
const response = await api.get('/admin/logs?action=Document Upload')

// Filter by date range
const response = await api.get('/admin/logs?start_date=2024-01-01&end_date=2024-01-31')
```

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden: Admin access required"
}
```

**404 Not Found:**
```json
{
  "error": "Document not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Using the API Client

The `api` helper from `@/lib/api-client` automatically handles authentication:

```typescript
import { api } from '@/lib/api-client'

// GET request
const response = await api.get('/documents')
if (response.success) {
  console.log(response.documents)
}

// POST request
const response = await api.post('/documents', {
  name: 'My Document',
  file_path: '/path/to/file.pdf',
  file_size: 1024000,
  file_type: 'application/pdf'
})

// PUT request
const response = await api.put(`/documents/${id}`, {
  name: 'Updated Name'
})

// DELETE request
const response = await api.delete(`/documents/${id}`)
```

