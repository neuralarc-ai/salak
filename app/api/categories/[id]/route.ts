import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, isAdmin, logAction, getClientIp } from '@/lib/auth-helpers'

// PUT /categories/:id - Update a category (Admin only)
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

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, status } = body
    const { id } = await params

    const supabase = createServerClient()

    // Check if category exists
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== existing.name) {
      const { data: nameExists } = await supabase
        .from('categories')
        .select('id')
        .eq('name', name)
        .single()

      if (nameExists) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    const { data: category, error: updateError } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !category) {
      console.error('Update category error:', updateError)
      await logAction(user.id, 'Category Update', `${id}`, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Category Update', `${category.name} (${id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      category,
    })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /categories/:id - Delete a category (Admin only)
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

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = createServerClient()

    // Check if category exists
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (docsError) {
      console.error('Check documents error:', docsError)
      return NextResponse.json(
        { error: 'Failed to check category usage' },
        { status: 500 }
      )
    }

    if (documents && documents.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category: it has associated documents. Set status to inactive instead.' },
        { status: 400 }
      )
    }

    // Soft delete: set status to inactive
    const { error: deleteError } = await supabase
      .from('categories')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (deleteError) {
      console.error('Delete category error:', deleteError)
      await logAction(user.id, 'Category Delete', `${id}`, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Category Delete', `${existing.name} (${id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

