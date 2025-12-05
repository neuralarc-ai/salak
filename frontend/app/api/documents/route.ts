import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'

// POST /documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, file_path, file_size, file_type, category_id, tags } = body

    // Validation
    if (!name || !file_path || !file_size || !file_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, file_path, file_size, file_type' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Create document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        name,
        description: description || null,
        file_path,
        file_size: parseInt(file_size),
        file_type,
        category_id: category_id || null,
        uploaded_by: user.id,
        status: 'active',
        tags: tags || [],
        version: 1,
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('Document creation error:', docError)
      await logAction(user.id, 'Document Upload', name, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Document Upload', `${name} (${document.id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      document,
    }, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /documents - Get all documents with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status') || 'active'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    // Build query
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

