import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, isAdmin, logAction, getClientIp } from '@/lib/auth-helpers'

// GET /documents/:id - Get a specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServerClient()

    // Build query - filter by user to ensure users only see their own documents
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
      `)
      .eq('id', id)
      // CRITICAL: Filter by user to ensure users only see their own documents
      .or(`user_id.eq.${user.id},uploaded_by.eq.${user.id}`)

    // Non-admins can only see active documents
    if (user.role !== 'admin') {
      query = query.eq('status', 'active')
    }

    const { data: document, error } = await query.single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /documents/:id - Update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServerClient()

    // Check if document exists and user has permission
    // Filter by user_id or uploaded_by to ensure users can only access their own documents
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('user_id, uploaded_by, status')
      .eq('id', id)
      .or(`user_id.eq.${user.id},uploaded_by.eq.${user.id}`)
      .single()

    if (fetchError || !existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Additional permission check: user can only update their own documents, admins can update any
    const isOwner = existingDoc.user_id === user.id || existingDoc.uploaded_by === user.id
    if (!isOwner && !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own documents' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, category_id, tags, status } = body

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category_id !== undefined) updateData.category_id = category_id
    if (tags !== undefined) updateData.tags = tags
    // Only admins can change status
    if (status !== undefined && isAdmin(user)) {
      updateData.status = status
    }

    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
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
      `)
      .single()

    if (updateError || !document) {
      console.error('Update document error:', updateError)
      await logAction(user.id, 'Document Update', `${id}`, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Document Update', `${document.name} (${id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /documents/:id - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServerClient()

    // Check if document exists and user has permission
    // Filter by user_id or uploaded_by to ensure users can only access their own documents
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('user_id, uploaded_by, name')
      .eq('id', id)
      .or(`user_id.eq.${user.id},uploaded_by.eq.${user.id}`)
      .single()

    if (fetchError || !existingDoc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Additional permission check: user can only delete their own documents, admins can delete any
    const isOwner = existingDoc.user_id === user.id || existingDoc.uploaded_by === user.id
    if (!isOwner && !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own documents' },
        { status: 403 }
      )
    }

    // Soft delete: set status to 'deleted' instead of actually deleting
    const { error: deleteError } = await supabase
      .from('documents')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (deleteError) {
      console.error('Delete document error:', deleteError)
      await logAction(user.id, 'Document Delete', `${id}`, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Document Delete', `${existingDoc.name} (${id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

