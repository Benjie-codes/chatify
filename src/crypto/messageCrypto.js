import { bufferToBase64, base64ToBuffer, stringToBuffer, bufferToString } from '../utils/encoding.js'

/**
 * Encrypt a plaintext message for a specific recipient.
 * Generates a random per-message AES-GCM key, encrypts the message,
 * and wraps the AES key twice (once for recipient, once for sender).
 *
 * Uses encrypt() instead of wrapKey() so that RSA public keys only need
 * the ['encrypt'] usage — which is what importPublicKey() and generateKey()
 * correctly produce.
 *
 * @param {string} plaintext - The message to encrypt
 * @param {CryptoKey} recipientPublicKey - The recipient's RSA-OAEP public key (usage: encrypt)
 * @param {CryptoKey} senderPublicKey   - The sender's own RSA-OAEP public key (usage: encrypt)
 * @returns {Promise<Object>} { ciphertext, iv, encryptedKey, encryptedKeyForSelf }
 */
export async function encryptMessage(plaintext, recipientPublicKey, senderPublicKey) {
  // 1. Generate a random AES-GCM 256-bit key for this specific message
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Must be extractable so we can export the raw bytes
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

  // 3. Export the AES key as raw bytes so we can RSA-encrypt it
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey)

  // 4. RSA-encrypt the raw AES key for the recipient (they decrypt with their private key)
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  )

  // 5. RSA-encrypt the raw AES key for ourselves (so we can read our own sent messages)
  const encryptedKeyForSelfBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    senderPublicKey,
    rawAesKey
  )

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
 * Uses decrypt() instead of unwrapKey() so that the RSA private key only needs
 * the ['decrypt'] usage — which is what unwrapPrivateKey() correctly produces.
 *
 * @param {Object}    payload      - { ciphertext, iv, encryptedKey, encryptedKeyForSelf }
 * @param {CryptoKey} myPrivateKey - The current user's RSA-OAEP private key (usage: decrypt)
 * @param {boolean}   isSender     - True if the current user sent this message
 * @returns {Promise<string|null>} The decrypted plaintext, or null on failure
 */
export async function decryptMessage(payload, myPrivateKey, isSender) {
  try {
    const { ciphertext, iv, encryptedKey, encryptedKeyForSelf } = payload

    if (!ciphertext || !iv || !encryptedKey) {
      console.warn('[messageCrypto] Missing required fields in payload', payload)
      return null
    }

    // 1. Pick the correct wrapped key
    //    - recipient uses encryptedKey (encrypted with THEIR public key)
    //    - sender    uses encryptedKeyForSelf (encrypted with THEIR OWN public key)
    const encryptedAesKeyBase64 = isSender ? encryptedKeyForSelf : encryptedKey

    if (!encryptedAesKeyBase64) {
      console.warn('[messageCrypto] Missing encryptedKeyForSelf for sender view', payload)
      return null
    }

    // 2. RSA-decrypt the wrapped AES key back to raw bytes
    const rawAesKeyBuffer = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      myPrivateKey,
      base64ToBuffer(encryptedAesKeyBase64)
    )

    // 3. Re-import the raw AES key for decryption
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawAesKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // 4. Decrypt the ciphertext
    const ivBuffer = base64ToBuffer(iv)
    const ciphertextBuffer = base64ToBuffer(ciphertext)

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      aesKey,
      ciphertextBuffer
    )

    // 5. Decode and return
    return bufferToString(plaintextBuffer)
  } catch (error) {
    console.error('[messageCrypto] Decryption failed:', error)
    return null
  }
}
