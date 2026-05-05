import { bufferToBase64, base64ToBuffer, stringToBuffer } from '../utils/encoding.js'

/**
 * Generate an RSA-OAEP 2048-bit keypair for encrypting per-message AES keys.
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateRSAKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true, // Must be extractable so we can wrap the private key
    ['encrypt', 'decrypt']
  )
}

/**
 * Export the RSA public key to a base64 string (SPKI format).
 * 
 * @param {CryptoKeyPair} keyPair
 * @returns {Promise<string>}
 */
export async function exportPublicKey(keyPair) {
  const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  return bufferToBase64(exported)
}

/**
 * Generate a random 128-bit (16-byte) salt for PBKDF2.
 * @returns {string} - base64 string of the salt
 */
export function generateSalt() {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return bufferToBase64(salt.buffer)
}

/**
 * Derives an AES-GCM key and wraps the private key.
 * (We use AES-GCM instead of AES-KW because WebCrypto AES-KW strictly requires
 * the key length to be a multiple of 8 bytes, which RSA PKCS8 exports often violate).
 * 
 * @param {CryptoKey} privateKey 
 * @param {string} password 
 * @param {string} saltBase64 
 * @returns {Promise<string>} - base64 wrapped key
 */
export async function wrapPrivateKey(privateKey, password, saltBase64) {
  const saltBuffer = base64ToBuffer(saltBase64)
  const passwordBuffer = stringToBuffer(password)
  
  // 1. Import password as a raw key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  // 2. Derive the 256-bit AES-GCM wrapping key
  const wrappingKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey']
  )

  // 3. Generate random 96-bit IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 4. Wrap the private key
  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    'pkcs8',
    privateKey,
    wrappingKey,
    { name: 'AES-GCM', iv }
  )

  // 5. Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + wrappedKeyBuffer.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(wrappedKeyBuffer), iv.length)

  return bufferToBase64(result.buffer)
}

/**
 * Derives an AES-GCM key and unwraps the private key into memory.
 * 
 * @param {string} wrappedPrivateKeyBase64 
 * @param {string} password 
 * @param {string} saltBase64 
 * @returns {Promise<CryptoKey>} - the unwrapped RSA-OAEP private key
 */
export async function unwrapPrivateKey(wrappedPrivateKeyBase64, password, saltBase64) {
  const saltBuffer = base64ToBuffer(saltBase64)
  const bytes = new Uint8Array(base64ToBuffer(wrappedPrivateKeyBase64))
  const passwordBuffer = stringToBuffer(password)

  // 1. Extract IV and ciphertext
  const iv = bytes.slice(0, 12)
  const wrappedBuffer = bytes.slice(12)

  // 2. Import password as a raw key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  // 3. Derive the 256-bit AES-GCM wrapping key
  const wrappingKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['unwrapKey']
  )

  // 4. Unwrap the private key
  return crypto.subtle.unwrapKey(
    'pkcs8',
    wrappedBuffer.buffer,
    wrappingKey,
    { name: 'AES-GCM', iv },
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false, // The unwrapped key should NEVER be extractable in memory
    ['decrypt']
  )
}

/**
 * Import an RSA public key from a base64 string (SPKI format).
 * 
 * @param {string} base64PublicKey 
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(base64PublicKey) {
  const buffer = base64ToBuffer(base64PublicKey)
  return crypto.subtle.importKey(
    'spki',
    buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  )
}
