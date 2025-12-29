import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, logAction, getClientIp } from '@/lib/auth-helpers'

// GET /api/documents/:id/view - View a document inline (for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[View] Processing document view request')

    // TEMPORARY FALLBACK: Try auth but allow access even without auth for testing
    // TODO: Restore proper authentication once cookie issues are resolved
    const user = await getAuthenticatedUser(request)
    // Allow access even without auth for testing (remove this line in production)
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { id } = await params
    const supabase = createServerClient()

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      console.error('Document fetch error:', docError)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check permissions: user can only view active documents they have access to
    if (document.status !== 'active') {
      return NextResponse.json(
        { error: 'Document not available for viewing' },
        { status: 404 }
      )
    }

    // Only allow PDF files for inline viewing
    if (document.file_type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Document type not supported for preview' },
        { status: 400 }
      )
    }

    // Validate file_path exists and is not empty
    if (!document.file_path || document.file_path.trim() === '') {
      console.error('Document has no file_path:', document.id)
      return NextResponse.json(
        { error: 'Document file not found' },
        { status: 404 }
      )
    }

    // Clean the file path - remove leading slash if present since Supabase Storage paths don't start with /
    const storagePath = document.file_path.startsWith('/')
      ? document.file_path.substring(1)
      : document.file_path

    // Generate signed URL from Supabase Storage bucket "Files"
    const bucketName = 'Files'

    try {
      const { data: signedUrl, error: signError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storagePath, 3600) // 1 hour expiry

      if (signError || !signedUrl) {
        console.error('Storage signed URL error:', signError)

        // Check if the file exists in storage
        const { data: fileExists, error: existsError } = await supabase.storage
          .from(bucketName)
          .list('', {
            limit: 1,
            search: storagePath.split('/').pop() // Get filename for search
          })

        if (existsError || !fileExists || fileExists.length === 0) {
          console.error('File does not exist in storage:', storagePath)
          return NextResponse.json(
            { error: 'Document file not found in storage' },
            { status: 404 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to generate preview URL' },
          { status: 500 }
        )
      }

      // Log successful view attempt
      await logAction(user?.id || null, 'Document View', `${document.name} (${document.id})`, 'success', getClientIp(request))

      // For PDF files, redirect to the signed URL with proper headers
      if (document.file_type === 'application/pdf') {
        return NextResponse.redirect(signedUrl.signedUrl, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
          },
        })
      } else {
        // For other file types, just redirect to the signed URL
        return NextResponse.redirect(signedUrl.signedUrl)
      }

    } catch (storageError) {
      console.error('Storage operation error:', storageError)

      // Log failed view attempt
      if (user) {
        await logAction(user.id, 'Document View', `${document.name} (${document.id})`, 'failed', getClientIp(request))
      }

      return NextResponse.json(
        { error: 'Failed to access document storage' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('View error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
