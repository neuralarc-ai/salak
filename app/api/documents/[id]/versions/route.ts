import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'

// GET /documents/:id/versions - Get all versions of a document
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

    // Check if document exists
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, name, status')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Non-admins can only see active documents
    if (user.role !== 'admin' && document.status !== 'active') {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from('document_versions')
      .select(`
        *,
        created_by:created_by (
          id,
          name,
          email
        )
      `)
      .eq('document_id', id)
      .order('version_number', { ascending: false })

    if (versionsError) {
      console.error('Get versions error:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
      },
      versions: versions || [],
    })
  } catch (error) {
    console.error('Get versions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

