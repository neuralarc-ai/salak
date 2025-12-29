import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'

// POST /documents/:id/version - Create a new version of a document
export async function POST(
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

    const body = await request.json()
    const { file_path, file_size, file_type, description } = body

    // Validation
    if (!file_path || !file_size || !file_type) {
      return NextResponse.json(
        { error: 'Missing required fields: file_path, file_size, file_type' },
        { status: 400 }
      )
    }

    const { id } = await params
    const supabase = createServerClient()

    // Check if document exists
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, name, version, status')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Non-admins can only create versions for active documents
    if (user.role !== 'admin' && document.status !== 'active') {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Get next version number
    const nextVersion = (document.version || 1) + 1

    // Create new version record
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: id,
        version_number: nextVersion,
        file_path,
        file_size: parseInt(file_size),
        file_type,
        description: description || null,
        created_by: user.id,
      })
      .select(`
        *,
        created_by:created_by (
          id,
          name,
          email
        )
      `)
      .single()

    if (versionError || !version) {
      console.error('Create version error:', versionError)
      await logAction(user.id, 'Document Version Create', `${id}`, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      )
    }

    // Update document version number
    await supabase
      .from('documents')
      .update({ version: nextVersion })
      .eq('id', id)

    await logAction(user.id, 'Document Version Create', `${document.name} v${nextVersion} (${id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      version,
    }, { status: 201 })
  } catch (error) {
    console.error('Create version error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

