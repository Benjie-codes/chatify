import { bufferToBase64, base64ToBuffer, stringToBuffer, bufferToString } from '../utils/encoding.js'

/**
 * Encrypt a plaintext message for a specific recipient.
 * Generates a random per-message AES-GCM key, encrypts the message,
 * and wraps the AES key twice (once for recipient, once for sender).
 * 
 * @param {string} plaintext - The message to encrypt
 * @param {CryptoKey} recipientPublicKey - The recipient's RSA-OAEP public key
 * @param {CryptoKey} senderPublicKey - The sender's own RSA-OAEP public key
 * @returns {Promise<Object>} The encrypted payload ready for API/WS
 */
export async function encryptMessage(plaintext, recipientPublicKey, senderPublicKey) {
  // 1. Generate a random AES-GCM 256-bit key for this specific message
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Must be extractable so we can wrap it
    ['encrypt', 'decrypt']
  )

  // 2. Encrypt the plaintext
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encodedText = stringToBuffer(plaintext)
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encodedText
  )

  // 3. Wrap the AES key for the recipient
  const encryptedKeyBuffer = await crypto.subtle.wrapKey(
    'raw',
    aesKey,
    recipientPublicKey,
    { name: 'RSA-OAEP' }
  )

  // 4. Wrap the AES key for the sender (so they can read their own sent messages)
  const encryptedKeyForSelfBuffer = await crypto.subtle.wrapKey(
    'raw',
    aesKey,
    senderPublicKey,
    { name: 'RSA-OAEP' }
  )

  // 5. Encode everything to Base64
  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    encryptedKey: bufferToBase64(encryptedKeyBuffer),
    encryptedKeyForSelf: bufferToBase64(encryptedKeyForSelfBuffer)
  }
}

/**
 * Decrypt an incoming or outgoing message payload.
 * 
 * @param {Object} payload - { ciphertext, iv, encryptedKey, encryptedKeyForSelf }
 * @param {CryptoKey} myPrivateKey - The current user's RSA-OAEP private key
 * @param {boolean} isSender - True if the current user sent this message
 * @returns {Promise<string|null>} The decrypted plaintext, or null if decryption fails
 */
export async function decryptMessage(payload, myPrivateKey, isSender) {
  try {
    const { ciphertext, iv, encryptedKey, encryptedKeyForSelf } = payload

    if (!ciphertext || !iv || !encryptedKey || !encryptedKeyForSelf) {
      console.warn('[messageCrypto] Missing fields in encrypted payload', payload)
      return null
    }

    // 1. Select the correct wrapped key
    const wrappedKeyBase64 = isSender ? encryptedKeyForSelf : encryptedKey
    const wrappedKeyBuffer = base64ToBuffer(wrappedKeyBase64)

    // 2. Unwrap the AES-GCM key
    const aesKey = await crypto.subtle.unwrapKey(
      'raw',
      wrappedKeyBuffer,
      myPrivateKey,
      { name: 'RSA-OAEP' },
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // 3. Decrypt the ciphertext
    const ivBuffer = base64ToBuffer(iv)
    const ciphertextBuffer = base64ToBuffer(ciphertext)

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      aesKey,
      ciphertextBuffer
    )

    // 4. Decode to string
    return bufferToString(plaintextBuffer)
  } catch (error) {
    console.error('[messageCrypto] Decryption failed:', error)
    return null
  }
}
