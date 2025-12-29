import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

/**
 * Encryption utility for API keys using AES-256-GCM
 * 
 * Requirements:
 * - API_KEY_ENCRYPTION_SECRET must be set in environment variables
 * - Uses SHA-256 to derive a 32-byte AES key from the secret
 * - Always generates a random 12-byte IV for each encryption
 * - Returns encrypted_key, iv, and auth_tag as Base64 strings
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 12 bytes for GCM
const KEY_LENGTH = 32 // 32 bytes for AES-256

/**
 * Get and validate the encryption secret from environment
 * Derives a 32-byte AES key using SHA-256
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET

  if (!secret) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET environment variable is required but not set. ' +
      'Please set it in your .env file.'
    )
  }

  if (secret.trim().length === 0) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET environment variable cannot be empty. ' +
      'Please set a valid secret in your .env file.'
    )
  }

  // Derive a 32-byte key using SHA-256
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * 
 * @param plaintext - The text to encrypt
 * @returns Object with encrypted_key, iv, and auth_tag (all Base64 encoded)
 * @throws Error if encryption fails or inputs are invalid
 */
export function encryptApiKey(plaintext: string): {
  encrypted_key: string
  iv: string
  auth_tag: string
} {
  try {
    // Validate input
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string')
    }

    if (plaintext.trim().length === 0) {
      throw new Error('Plaintext cannot be empty')
    }

    // Get encryption key
    const key = getEncryptionKey()

    // Generate random IV (12 bytes for GCM)
    const iv = randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv)

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Return Base64 encoded strings
    return {
      encrypted_key: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      auth_tag: authTag.toString('base64'),
    }
  } catch (error) {
    // Re-throw with context if it's our validation error
    if (error instanceof Error && error.message.includes('Plaintext')) {
      throw error
    }
    // Wrap crypto errors
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt an encrypted API key using AES-256-GCM
 * 
 * @param encrypted_key - Base64 encoded encrypted data
 * @param iv - Base64 encoded initialization vector
 * @param auth_tag - Base64 encoded authentication tag
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or inputs are invalid
 */
export function decryptApiKey(
  encrypted_key: string,
  iv: string,
  auth_tag: string
): string {
  try {
    // Validate all required fields exist
    if (!encrypted_key || typeof encrypted_key !== 'string' || encrypted_key.trim().length === 0) {
      throw new Error('encrypted_key is required and must be a non-empty string')
    }

    if (!iv || typeof iv !== 'string' || iv.trim().length === 0) {
      throw new Error('iv is required and must be a non-empty string')
    }

    if (!auth_tag || typeof auth_tag !== 'string' || auth_tag.trim().length === 0) {
      throw new Error('auth_tag is required and must be a non-empty string')
    }

    // Get decryption key
    const key = getEncryptionKey()

    // Decode Base64 strings
    let encryptedBuffer: Buffer
    let ivBuffer: Buffer
    let authTagBuffer: Buffer

    try {
      encryptedBuffer = Buffer.from(encrypted_key, 'base64')
      ivBuffer = Buffer.from(iv, 'base64')
      authTagBuffer = Buffer.from(auth_tag, 'base64')
    } catch (decodeError) {
      throw new Error('Invalid Base64 encoding in encrypted data')
    }

    // Validate IV length
    if (ivBuffer.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${ivBuffer.length}`)
    }

    // Validate auth tag length (GCM auth tag is always 16 bytes)
    if (authTagBuffer.length !== 16) {
      throw new Error(`Invalid auth tag length: expected 16 bytes, got ${authTagBuffer.length}`)
    }

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(authTagBuffer)

    // Decrypt
    let decrypted = decipher.update(encryptedBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (error) {
    // Re-throw validation errors as-is
    if (error instanceof Error && (
      error.message.includes('required') ||
      error.message.includes('Invalid') ||
      error.message.includes('length')
    )) {
      throw error
    }
    // Wrap crypto errors (including authentication failures)
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

