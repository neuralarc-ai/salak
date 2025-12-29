import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

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

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check permissions: user can only share active documents they have access to
    if (document.status !== 'active') {
      return NextResponse.json(
        { error: 'Document not available for sharing' },
        { status: 404 }
      )
    }

    // Generate signed URL from Supabase Storage bucket "Files"
    const bucketName = 'Files'
    const { data: signedUrl, error: signError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(document.file_path, 600) // 10 minutes expiry

    if (signError || !signedUrl) {
      console.error('Storage signed URL error:', signError)
      return NextResponse.json(
        { error: 'Failed to generate share link' },
        { status: 500 }
      )
    }

    const shareUrl = signedUrl.signedUrl

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresIn: '10 minutes',
      documentName: document.name,
    })

  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
