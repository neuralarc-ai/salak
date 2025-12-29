/**
 * Create Dummy Data Script
 * Creates multiple test users, documents, and categories for testing
 * Run with: cd frontend && node scripts/create-dummy-data.js
 */

require('dotenv').config({ path: '.env.local' })
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' })
}

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function createDummyData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   Please check your .env.local file')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('\n🎭 Creating Dummy Data for Testing...\n')

  // Test users with different roles
  const testUsers = [
    {
      email: 'admin@rdms.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin',
    },
    {
      email: 'john@rdms.com',
      password: 'password123',
      name: 'John Doe',
      role: 'user',
    },
    {
      email: 'jane@rdms.com',
      password: 'password123',
      name: 'Jane Smith',
      role: 'user',
    },
    {
      email: 'bob@rdms.com',
      password: 'password123',
      name: 'Bob Johnson',
      role: 'user',
    },
    {
      email: 'alice@rdms.com',
      password: 'password123',
      name: 'Alice Williams',
      role: 'user',
    },
  ]

  const createdUsers = []

  // Create users
  console.log('👥 Creating Test Users...\n')
  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', testUser.email)
        .single()

      if (existing) {
        console.log(`⚠️  User ${testUser.email} already exists, using existing user...`)
        createdUsers.push(existing)
        continue
      }

      // Hash password
      const password_hash = await bcrypt.hash(testUser.password, 10)

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: testUser.email,
          password_hash,
          name: testUser.name,
          role: testUser.role,
        })
        .select('id, email, name, role')
        .single()

      if (error) {
        console.error(`❌ Failed to create ${testUser.email}:`, error.message)
      } else {
        console.log(`✅ Created user: ${testUser.email} (${testUser.role})`)
        createdUsers.push(user)
      }
    } catch (error) {
      console.error(`❌ Error creating ${testUser.email}:`, error.message)
    }
  }

  // Get user IDs for creating documents
  const userIds = {}
  for (const user of createdUsers) {
    userIds[user.email] = user.id
  }

  // If users already existed, fetch them
  if (createdUsers.length < testUsers.length) {
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email')
      .in('email', testUsers.map(u => u.email))
    
    if (allUsers) {
      allUsers.forEach(user => {
        userIds[user.email] = user.id
      })
    }
  }

  console.log('\n📁 Creating Categories...\n')

  // Create categories
  const categories = [
    { name: 'Documents', description: 'General documents' },
    { name: 'Reports', description: 'Business reports' },
    { name: 'Contracts', description: 'Legal contracts' },
    { name: 'Presentations', description: 'PowerPoint presentations' },
    { name: 'Forms', description: 'Application forms' },
  ]

  const createdCategories = []

  for (const category of categories) {
    try {
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id, name')
        .eq('name', category.name)
        .single()

      if (existing) {
        console.log(`⚠️  Category "${category.name}" already exists, using existing...`)
        createdCategories.push(existing)
        continue
      }

      const { data: cat, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          description: category.description,
          status: 'active',
        })
        .select('id, name')
        .single()

      if (error) {
        console.error(`❌ Failed to create category "${category.name}":`, error.message)
      } else {
        console.log(`✅ Created category: ${category.name}`)
        createdCategories.push(cat)
      }
    } catch (error) {
      console.error(`❌ Error creating category "${category.name}":`, error.message)
    }
  }

  // Get category IDs
  const categoryIds = {}
  if (createdCategories.length > 0) {
    createdCategories.forEach(cat => {
      categoryIds[cat.name] = cat.id
    })
  }

  console.log('\n📄 Creating Sample Documents...\n')

  // Create sample documents
  const documents = [
    {
      name: 'Project Proposal 2024',
      description: 'Annual project proposal document',
      file_path: '/documents/project-proposal-2024.pdf',
      file_size: 2048000,
      file_type: 'application/pdf',
      category_id: categoryIds['Documents'] || null,
      uploaded_by: userIds['john@rdms.com'] || Object.values(userIds)[0],
      tags: ['project', 'proposal', '2024'],
    },
    {
      name: 'Q4 Financial Report',
      description: 'Quarterly financial analysis',
      file_path: '/documents/q4-financial-report.xlsx',
      file_size: 1536000,
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      category_id: categoryIds['Reports'] || null,
      uploaded_by: userIds['jane@rdms.com'] || Object.values(userIds)[0],
      tags: ['financial', 'quarterly', 'report'],
    },
    {
      name: 'Service Agreement Template',
      description: 'Standard service agreement template',
      file_path: '/documents/service-agreement-template.docx',
      file_size: 512000,
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      category_id: categoryIds['Contracts'] || null,
      uploaded_by: userIds['admin@rdms.com'] || Object.values(userIds)[0],
      tags: ['contract', 'template', 'legal'],
    },
    {
      name: 'Product Launch Presentation',
      description: 'Presentation for new product launch',
      file_path: '/documents/product-launch.pptx',
      file_size: 3072000,
      file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      category_id: categoryIds['Presentations'] || null,
      uploaded_by: userIds['bob@rdms.com'] || Object.values(userIds)[0],
      tags: ['presentation', 'product', 'launch'],
    },
    {
      name: 'Employee Onboarding Form',
      description: 'New employee onboarding checklist',
      file_path: '/documents/onboarding-form.pdf',
      file_size: 256000,
      file_type: 'application/pdf',
      category_id: categoryIds['Forms'] || null,
      uploaded_by: userIds['alice@rdms.com'] || Object.values(userIds)[0],
      tags: ['form', 'hr', 'onboarding'],
    },
  ]

  let documentsCreated = 0
  for (const doc of documents) {
    try {
      // Check if document exists
      const { data: existing } = await supabase
        .from('documents')
        .select('id, name')
        .eq('name', doc.name)
        .single()

      if (existing) {
        console.log(`⚠️  Document "${doc.name}" already exists, skipping...`)
        continue
      }

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          ...doc,
          status: 'active',
          version: 1,
        })
        .select('id, name')
        .single()

      if (error) {
        console.error(`❌ Failed to create document "${doc.name}":`, error.message)
      } else {
        console.log(`✅ Created document: ${doc.name}`)
        documentsCreated++
      }
    } catch (error) {
      console.error(`❌ Error creating document "${doc.name}":`, error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Dummy Data Creation Complete!\n')
  console.log('📋 Test Credentials for Sign In:\n')
  
  testUsers.forEach(user => {
    console.log(`${user.role === 'admin' ? '🔑' : '👤'} ${user.name} (${user.role})`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${user.password}\n`)
  })

  console.log('📊 Summary:')
  console.log(`   Users: ${createdUsers.length} created`)
  console.log(`   Categories: ${createdCategories.length} created`)
  console.log(`   Documents: ${documentsCreated} created\n`)
  console.log('💡 You can now test sign in with any of the credentials above!\n')
}

createDummyData().catch(console.error)





