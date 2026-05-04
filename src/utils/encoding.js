/**
 * encoding.js — Base64 / ArrayBuffer / string conversion utilities.
 *
 * The Web Crypto API works with ArrayBuffers. These helpers convert
 * between ArrayBuffers and the base64 strings used by the WhisperBox API.
 */

/**
 * Encode an ArrayBuffer to a base64 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Decode a base64 string to an ArrayBuffer.
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Encode a UTF-8 string to an ArrayBuffer.
 * @param {string} str
 * @returns {ArrayBuffer}
 */
export function stringToBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

/**
 * Decode an ArrayBuffer to a UTF-8 string.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function bufferToString(buffer) {
  return new TextDecoder().decode(buffer)
}

/**
 * Generate a cryptographically secure random base64 string.
 * Useful for generating salts and IVs.
 *
 * @param {number} byteLength - Number of random bytes (e.g. 16 for 128-bit, 12 for 96-bit)
 * @returns {string} base64-encoded random bytes
 */
export function randomBase64(byteLength) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return bufferToBase64(bytes.buffer)
}
