/**
 * keyStore — in-memory store for the user's RSA private key.
 *
 * IMPORTANT: This store intentionally has NO persistence layer.
 * The raw CryptoKey object is kept ONLY in memory for the lifetime
 * of the browser session. On reload, the user must re-derive it from
 * their password + the wrapped_private_key stored on the server.
 */

import { create } from 'zustand'
import { unwrapPrivateKey, importPublicKey } from '../crypto/keyManager'

const useKeyStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────

  /** RSA-OAEP CryptoKey (private) — unwrapped at login, never persisted */
  privateKey: null,

  /** RSA-OAEP CryptoKey (public) — derived from UserProfile.public_key */
  publicKey: null,

  /** Whether the crypto session is ready (keys are loaded in memory) */
  isReady: false,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Initialize the keys from the login response.
   * Runs after login, calls unwrapPrivateKey, and sets keys in memory.
   *
   * @param {Object} loginResponse 
   * @param {string} password 
   */
  initKeys: async (loginResponse, password) => {
    const { wrapped_private_key, pbkdf2_salt, public_key } = loginResponse.user
    
    const privateKey = await unwrapPrivateKey(
      wrapped_private_key, 
      password, 
      pbkdf2_salt
    )
    
    const publicKey = await importPublicKey(public_key)

    set({ privateKey, publicKey, isReady: true })
  },

  /**
   * Clear keys from memory — called on logout.
   */
  clearKeys: () => {
    set({ privateKey: null, publicKey: null, isReady: false })
  },

  getPrivateKey: () => get().privateKey,
  getPublicKey: () => get().publicKey,
}))

export default useKeyStore
