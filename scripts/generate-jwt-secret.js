#!/usr/bin/env node

/**
 * Generate a secure JWT secret for the application
 * Run with: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto')

// Generate a 256-bit (32-byte) random secret
const jwtSecret = crypto.randomBytes(32).toString('hex')

console.log('🔐 Generated JWT Secret:')
console.log('========================')
console.log(jwtSecret)
console.log('========================')
console.log('')
console.log('📝 Add this to your .env.local file:')
console.log('JWT_SECRET=' + jwtSecret)
console.log('')
console.log('⚠️  IMPORTANT: Keep this secret secure and never commit it to version control!')
console.log('   The .env.local file is already in .gitignore, so it won\'t be committed.')


