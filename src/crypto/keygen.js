import { bufferToBase64, base64ToBuffer, stringToBuffer } from '../utils/encoding'

/**
 * Generate an RSA-OAEP 2048-bit keypair for encrypting per-message AES keys.
 * The private key is made extractable ONLY for wrapping, but we NEVER export it to raw bytes directly.
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
    true, // Must be true so we can wrap it
    ['encrypt', 'decrypt']
  )
}

/**
 * Generate a random 128-bit (16-byte) salt for PBKDF2.
 * @returns {ArrayBuffer}
 */
export function generateSalt() {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return salt.buffer
}

/**
 * Derive an AES-GCM key from a password and salt using PBKDF2.
 * (We use AES-GCM instead of AES-KW for wrapping because WebCrypto AES-KW
 * strictly requires 8-byte multiples, and RSA pkcs8 exports vary in length).
 * 
 * @param {string} password 
 * @param {ArrayBuffer} saltBuffer 
 * @returns {Promise<CryptoKey>}
 */
export async function deriveWrappingKey(password, saltBuffer) {
  const passwordBuffer = stringToBuffer(password)
  
  // 1. Import password as a raw key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  // 2. Derive the 256-bit AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Wrapping key itself cannot be extracted
    ['wrapKey', 'unwrapKey']
  )
}

/**
 * Wrap (encrypt) the RSA private key using the AES-GCM wrapping key.
 * Prepends the 12-byte IV to the returned buffer.
 * 
 * @param {CryptoKey} privateKey - The RSA-OAEP private key
 * @param {CryptoKey} wrappingKey - The AES-GCM key derived from the password
 * @returns {Promise<ArrayBuffer>} - The [IV + wrapped key] bytes
 */
export async function wrapPrivateKey(privateKey, wrappingKey) {
  // Generate random 96-bit IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    'pkcs8',
    privateKey,
    wrappingKey,
    { name: 'AES-GCM', iv }
  )

  // Concatenate IV + Ciphertext
  const result = new Uint8Array(iv.length + wrappedKeyBuffer.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(wrappedKeyBuffer), iv.length)
  
  return result.buffer
}

/**
 * Unwrap (decrypt) the RSA private key using the AES-GCM wrapping key.
 * Expects the 12-byte IV to be prepended to the buffer.
 * 
 * @param {ArrayBuffer} wrappedKeyBuffer - The [IV + wrapped key] bytes
 * @param {CryptoKey} wrappingKey - The AES-GCM key derived from the password
 * @returns {Promise<CryptoKey>} - The unwrapped RSA-OAEP private key
 */
export async function unwrapPrivateKey(wrappedKeyBuffer, wrappingKey) {
  const bytes = new Uint8Array(wrappedKeyBuffer)
  const iv = bytes.slice(0, 12)
  const ciphertext = bytes.slice(12)

  return crypto.subtle.unwrapKey(
    'pkcs8',
    ciphertext.buffer,
    wrappingKey,
    { name: 'AES-GCM', iv },
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false, // The unwrapped key should NOT be extractable in memory
    ['decrypt']
  )
}

/**
 * Export the RSA public key to a base64 string (SPKI format).
 * 
 * @param {CryptoKey} publicKey 
 * @returns {Promise<string>}
 */
export async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey('spki', publicKey)
  return bufferToBase64(exported)
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
    true, // Public keys are safe to be extractable
    ['encrypt']
  )
}
