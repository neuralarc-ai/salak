import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getAuthenticatedUser, isAdmin, logAction, getClientIp } from '@/lib/auth-helpers'

// GET /categories - Get all categories
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
    const status = searchParams.get('status') || 'active'
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const supabase = createServerClient()

    // Build query
    let query = supabase
      .from('categories')
      .select('*, document_count:documents(count)', { count: 'exact' })
      .order('name', { ascending: true })

    // Non-admins can only see active categories
    if (user.role !== 'admin' || !includeInactive) {
      query = query.eq('status', 'active')
    } else if (status) {
      query = query.eq('status', status)
    }

    const { data: categories, error, count } = await query

    if (error) {
      console.error('Get categories error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // Format response with document counts
    const formattedCategories = (categories || []).map((cat: any) => ({
      ...cat,
      document_count: cat.document_count?.[0]?.count || 0,
    }))

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
      total: count || 0,
    })
  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /categories - Create a new category (Admin only)
export async function POST(request: NextRequest) {
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
    const { name, description, status = 'active' } = body

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      )
    }

    // Create category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || null,
        status,
      })
      .select()
      .single()

    if (catError || !category) {
      console.error('Create category error:', catError)
      await logAction(user.id, 'Category Create', name, 'failed', getClientIp(request))
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      )
    }

    await logAction(user.id, 'Category Create', `${name} (${category.id})`, 'success', getClientIp(request))

    return NextResponse.json({
      success: true,
      category,
    }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

