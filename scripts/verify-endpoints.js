/**
 * Verify all API endpoints are implemented
 * Run with: node scripts/verify-endpoints.js
 */

const fs = require('fs')
const path = require('path')

const requiredEndpoints = [
  { method: 'GET', path: '/api/auth/me', file: 'app/api/auth/me/route.ts' },
  { method: 'POST', path: '/api/documents', file: 'app/api/documents/route.ts' },
  { method: 'GET', path: '/api/documents', file: 'app/api/documents/route.ts' },
  { method: 'GET', path: '/api/documents/:id', file: 'app/api/documents/[id]/route.ts' },
  { method: 'PUT', path: '/api/documents/:id', file: 'app/api/documents/[id]/route.ts' },
  { method: 'DELETE', path: '/api/documents/:id', file: 'app/api/documents/[id]/route.ts' },
  { method: 'POST', path: '/api/documents/:id/version', file: 'app/api/documents/[id]/version/route.ts' },
  { method: 'GET', path: '/api/documents/:id/versions', file: 'app/api/documents/[id]/versions/route.ts' },
  { method: 'GET', path: '/api/categories', file: 'app/api/categories/route.ts' },
  { method: 'POST', path: '/api/categories', file: 'app/api/categories/route.ts' },
  { method: 'PUT', path: '/api/categories/:id', file: 'app/api/categories/[id]/route.ts' },
  { method: 'DELETE', path: '/api/categories/:id', file: 'app/api/categories/[id]/route.ts' },
  { method: 'GET', path: '/api/admin/logs', file: 'app/api/admin/logs/route.ts' },
]

function checkEndpoint(endpoint) {
  const filePath = path.join(__dirname, '..', endpoint.file)
  
  if (!fs.existsSync(filePath)) {
    return { exists: false, hasMethod: false, error: 'File not found' }
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const methodName = `export async function ${endpoint.method}`
  const hasMethod = content.includes(methodName)

  return {
    exists: true,
    hasMethod,
    fileSize: content.length,
  }
}

console.log('🔍 Verifying API Endpoints...\n')
console.log('═'.repeat(80))

let allPassed = true
const results = []

requiredEndpoints.forEach((endpoint, index) => {
  const result = checkEndpoint(endpoint)
  results.push({ endpoint, result })

  const status = result.exists && result.hasMethod ? '✅' : '❌'
  const methodStatus = result.hasMethod ? 'OK' : 'MISSING'
  
  console.log(`${status} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(40)} ${methodStatus}`)
  
  if (!result.exists) {
    console.log(`   ❌ File not found: ${endpoint.file}`)
    allPassed = false
  } else if (!result.hasMethod) {
    console.log(`   ❌ Method ${endpoint.method} not found in ${endpoint.file}`)
    allPassed = false
  }
})

console.log('═'.repeat(80))
console.log('')

const passed = results.filter(r => r.result.exists && r.result.hasMethod).length
const total = results.length

console.log(`📊 Summary: ${passed}/${total} endpoints verified`)
console.log('')

if (allPassed) {
  console.log('🎉 All endpoints are implemented and verified!')
  console.log('   All 13 required endpoints are present with correct HTTP methods.')
} else {
  console.log('⚠️  Some endpoints are missing or incomplete.')
  console.log('   Please check the errors above.')
}

console.log('')

