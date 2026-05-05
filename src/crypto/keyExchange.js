import api from '../services/api'
import { importPublicKey } from './keyManager'

const keyCache = new Map()

/**
 * Fetches and imports the public key for a given user.
 * Keys are cached in memory to avoid repeated requests.
 * 
 * @param {string} userId 
 * @returns {Promise<CryptoKey>} - the imported RSA-OAEP public key
 */
export async function fetchRecipientPublicKey(userId) {
  if (keyCache.has(userId)) {
    return keyCache.get(userId)
  }
  
  const { data } = await api.get(`/users/${userId}/public-key`)
  const cryptoKey = await importPublicKey(data.public_key)
  
  keyCache.set(userId, cryptoKey)
  return cryptoKey
}
