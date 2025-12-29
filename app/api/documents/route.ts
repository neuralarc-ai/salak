import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'
import { randomUUID } from 'crypto'

// POST /documents - Create a new document with file upload
export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Headers:', Object.fromEntries(request.headers.entries()))
    console.log('[Upload API] Auth header:', request.headers.get('authorization'))

    const user = await getAuthenticatedUser(request)

    if (!user) {
      console.log('[Upload API] Authentication failed - no user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Upload API] User authenticated:', user.email)

    const supabase = createServerClient()

    // Handle multipart form data for file upload
    console.log('[Upload] Processing file upload request')
    console.log('[Upload] Content-Type:', request.headers.get('content-type'))
    
    let formData: FormData
    try {
      formData = await request.formData()
      console.log('[Upload] FormData parsed successfully')
      console.log('[Upload] FormData keys:', Array.from(formData.keys()))
    } catch (formDataError) {
      console.error('[Upload] Error parsing FormData:', formDataError)
      return NextResponse.json(
        { error: 'Failed to parse form data. Please ensure the request is sent as multipart/form-data.' },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File
    let name = formData.get('name') as string
    const description = formData.get('description') as string
    const category_id = formData.get('category_id') as string
    const tagsString = formData.get('tags') as string

    console.log('[Upload] File received:', { name, type: file?.type, size: file?.size })

    // Validation
    if (!file) {
      console.error('[Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!name) {
      name = file.name
    }

    // Parse tags
    const tags = tagsString
      ? tagsString.split(',').map(t => t.trim()).filter(t => t)
      : []

    // Generate unique filename to avoid conflicts
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`

    // Upload file to Supabase Storage bucket "Files"
    const bucketName = 'Files'
    console.log('[Upload] Attempting to upload to bucket:', bucketName, 'filename:', uniqueFilename)
    console.log('[Upload] File type:', file.type, 'File size:', file.size)

    // Convert File to ArrayBuffer for Supabase Storage
    let fileBuffer: ArrayBuffer
    try {
      if (file instanceof File) {
        fileBuffer = await file.arrayBuffer()
      } else {
        // If it's already a buffer or Blob
        fileBuffer = file as ArrayBuffer
      }
      console.log('[Upload] File converted to buffer, size:', fileBuffer.byteLength)
    } catch (bufferError) {
      console.error('[Upload] Error converting file to buffer:', bufferError)
      await logAction(user.id, 'Document Upload', name, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to process file for upload' },
        { status: 500 }
      )
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFilename, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      })

    if (uploadError) {
      console.error('[Upload] File upload error:', uploadError)
      console.error('[Upload] Error details:', JSON.stringify(uploadError, null, 2))
      await logAction(user.id, 'Document Upload', name, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: `Failed to upload file to storage: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('[Upload] File uploaded successfully:', uploadData)

    // Create document record with the storage path
    // Set both user_id and uploaded_by to ensure proper user isolation
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        name,
        description: description || null,
        file_path: uniqueFilename, // Store just the filename, bucket is fixed
        file_size: file.size,
        file_type: file.type,
        category_id: category_id || null,
        user_id: user.id, // Set user_id for user isolation
        uploaded_by: user.id, // Keep uploaded_by for backward compatibility
        status: 'active',
        tags: tags,
        version: 1,
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('Document creation error:', docError)
      // Try to clean up uploaded file if document creation failed
      try {
        await supabase.storage.from(bucketName).remove([uniqueFilename])
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }

      await logAction(user.id, 'Document Upload', name, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Document Upload', `${name} (${document.id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      document,
    }, { status: 201 })
  } catch (error) {
    console.error('[Upload] Create document error:', error)
    console.error('[Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[Upload] Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

// GET /documents - Get all documents with filtering
export async function GET(request: NextRequest) {
  try {
    console.log('[Documents GET] Headers:', Object.fromEntries(request.headers.entries()))
    console.log('[Documents GET] Auth header:', request.headers.get('authorization'))

    const user = await getAuthenticatedUser(request)

    if (!user) {
      console.log('[Documents GET] Authentication failed')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Documents GET] User authenticated:', user.email)

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    // Build query - filter by user_id or uploaded_by to ensure users only see their own documents
    let query = supabase
      .from('documents')
      .select(`
        *,
        categories:category_id (
          id,
          name,
          description
        ),
        uploader:uploaded_by (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // CRITICAL: Filter by user to ensure users only see their own documents
    // Check both user_id and uploaded_by for backward compatibility
    // Use .or() with proper format
    query = query.or(`user_id.eq.${user.id},uploaded_by.eq.${user.id}`)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Non-admins can only see active documents
    if (user.role !== 'admin') {
      query = query.eq('status', 'active')
    }

    const { data: documents, error, count } = await query

    if (error) {
      console.error('Get documents error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

