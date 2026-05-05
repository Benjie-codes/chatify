import { bufferToBase64, base64ToBuffer } from '../utils/encoding.js'

/**
 * Encrypt a File or Blob symmetrically using a random AES-GCM key.
 * This is meant for encrypting large media files before uploading them
 * to an untrusted public CDN.
 * 
 * @param {Blob|File} file - The file to encrypt
 * @returns {Promise<{encryptedBlob: Blob, fileKeyBase64: string, ivBase64: string}>}
 */
export async function encryptFile(file) {
  // 1. Generate a random AES-GCM 256-bit key for this specific file
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable
    ['encrypt', 'decrypt']
  )

  // 2. Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 3. Read the file as an ArrayBuffer
  const fileArrayBuffer = await file.arrayBuffer()

  // 4. Encrypt the ArrayBuffer
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    fileKey,
    fileArrayBuffer
  )

  // 5. Export the key as raw bytes to share it over the secure E2EE channel
  const rawKey = await crypto.subtle.exportKey('raw', fileKey)

  return {
    // We store the encrypted bytes as a Blob for easy uploading
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    fileKeyBase64: bufferToBase64(rawKey),
    ivBase64: bufferToBase64(iv.buffer)
  }
}

/**
 * Decrypt a downloaded encrypted Blob symmetrically.
 * 
 * @param {Blob} encryptedBlob - The encrypted file data downloaded from CDN
 * @param {string} fileKeyBase64 - The AES key in base64 format (received via E2EE)
 * @param {string} ivBase64 - The IV in base64 format (received via E2EE)
 * @param {string} mimeType - The original MIME type of the file
 * @returns {Promise<Blob>} The decrypted plaintext Blob
 */
export async function decryptFile(encryptedBlob, fileKeyBase64, ivBase64, mimeType) {
  try {
    // 1. Convert base64 key and IV back to ArrayBuffers
    const rawKeyBuffer = base64ToBuffer(fileKeyBase64)
    const ivBuffer = base64ToBuffer(ivBase64)

    // 2. Import the AES key
    const fileKey = await crypto.subtle.importKey(
      'raw',
      rawKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // 3. Read the encrypted blob into an ArrayBuffer
    const encryptedArrayBuffer = await encryptedBlob.arrayBuffer()

    // 4. Decrypt the ArrayBuffer
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      fileKey,
      encryptedArrayBuffer
    )

    // 5. Return as a Blob with the correct original MIME type
    return new Blob([decryptedBuffer], { type: mimeType })
  } catch (error) {
    console.error('[mediaCrypto] Decryption failed:', error)
    throw error
  }
}
