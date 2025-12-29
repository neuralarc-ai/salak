// Test upload with declaration.pdf file
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
// Use native FormData (Node.js 18+)

async function testUploadDeclaration() {
  try {
    console.log('🧪 Testing upload with declaration.pdf...\n')

    // Step 1: Check if file exists
    const filePath = path.join(__dirname, '..', 'declaration.pdf')
    console.log('1. Checking file...')
    console.log('File path:', filePath)
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath)
      return
    }

    const fileStats = fs.statSync(filePath)
    console.log('✅ File found')
    console.log('   Size:', (fileStats.size / 1024).toFixed(2), 'KB')
    console.log('   Path:', filePath)

    // Step 2: Login
    console.log('\n2. Logging in...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@rdms.com',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData.error)
      return
    }

    console.log('✅ Login successful')
    const token = loginData.session.access_token
    if (!token) {
      console.error('❌ No token received')
      return
    }
    console.log('   Token received:', token.substring(0, 30) + '...')

    // Step 3: Upload file
    console.log('\n3. Uploading declaration.pdf...')
    
    // Read file stats
    const fileBuffer = fs.readFileSync(filePath)
    console.log('   File size:', (fileBuffer.length / 1024).toFixed(2), 'KB')
    
    // Create FormData using native FormData (Node.js 18+)
    // Convert buffer to Blob for FormData
    const { Blob } = require('buffer')
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' })
    
    const formData = new FormData()
    formData.append('file', fileBlob, 'declaration.pdf')
    formData.append('name', 'Declaration Document')
    formData.append('description', 'Test upload of declaration.pdf to Supabase Storage')
    formData.append('category_id', '')
    formData.append('tags', 'test,declaration,pdf')

    console.log('   Sending request to /api/documents...')

    const uploadResponse = await fetch('http://localhost:3000/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    console.log('   Response status:', uploadResponse.status)
    const uploadData = await uploadResponse.json()

    if (!uploadResponse.ok) {
      console.error('❌ Upload failed:', uploadData.error)
      console.error('   Full response:', JSON.stringify(uploadData, null, 2))
      return
    }

    console.log('✅ Upload successful!')
    console.log('   Document ID:', uploadData.document.id)
    console.log('   File path stored:', uploadData.document.file_path)
    console.log('   File size:', uploadData.document.file_size, 'bytes')
    console.log('   File type:', uploadData.document.file_type)

    // Step 4: Verify file in Supabase Storage
    console.log('\n4. Verifying file in Supabase Storage...')
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const bucketName = 'Files'
    const storedPath = uploadData.document.file_path

    // List files in bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list('', {
        limit: 100
      })

    if (listError) {
      console.error('❌ Error listing files:', listError.message)
    } else {
      console.log('✅ Files in bucket:', files.length)
      const uploadedFile = files.find(f => f.name === storedPath)
      if (uploadedFile) {
        console.log('✅ File found in storage!')
        console.log('   Name:', uploadedFile.name)
        console.log('   Size:', uploadedFile.metadata?.size || 'unknown', 'bytes')
        console.log('   Created:', uploadedFile.created_at)
      } else {
        console.log('⚠️  File not found in storage list')
        console.log('   Looking for:', storedPath)
        console.log('   Available files:', files.map(f => f.name).slice(0, 5))
      }
    }

    // Step 5: Test view endpoint
    console.log('\n5. Testing view endpoint...')
    const documentId = uploadData.document.id
    const viewResponse = await fetch(`http://localhost:3000/api/documents/${documentId}/view`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (viewResponse.ok) {
      console.log('✅ View endpoint working')
      const contentType = viewResponse.headers.get('content-type')
      console.log('   Content-Type:', contentType)
      const contentLength = viewResponse.headers.get('content-length')
      if (contentLength) {
        console.log('   Content-Length:', contentLength, 'bytes')
      }
    } else {
      console.error('❌ View endpoint failed:', viewResponse.status)
      const errorText = await viewResponse.text()
      console.error('   Error:', errorText.substring(0, 200))
    }

    // Step 6: Generate signed URL to verify direct access
    console.log('\n6. Generating signed URL...')
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storedPath, 3600)

    if (urlError) {
      console.error('❌ Error generating signed URL:', urlError.message)
    } else {
      console.log('✅ Signed URL generated')
      console.log('   URL:', signedUrl.signedUrl.substring(0, 100) + '...')
      console.log('   Expires in: 1 hour')
    }

    console.log('\n✅ All tests completed!')
    console.log('\nSummary:')
    console.log('  - File uploaded:', filePath)
    console.log('  - Document ID:', uploadData.document.id)
    console.log('  - Storage path:', storedPath)
    console.log('  - Bucket:', bucketName)

  } catch (error) {
    console.error('💥 Test error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testUploadDeclaration()
