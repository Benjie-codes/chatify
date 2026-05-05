/**
 * useAuth — encapsulates login / logout side-effects.
 *
 * Handles:
 *   - Calling the API
 *   - Updating authStore & keyStore
 *   - Connecting / disconnecting the WebSocket
 *   - Navigation
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import socketService from '../services/socket'
import useAuthStore from '../store/authStore'
import useKeyStore from '../store/keyStore'
import { parseApiError } from '../utils/errors'
import {
  generateRSAKeyPair,
  generateSalt,
  wrapPrivateKey,
  exportPublicKey
} from '../crypto/keyManager'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const storeLogin = useAuthStore((s) => s.login)
  const storeLogout = useAuthStore((s) => s.logout)
  const token = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  const initKeys = useKeyStore((s) => s.initKeys)
  const clearKeys = useKeyStore((s) => s.clearKeys)

  const navigate = useNavigate()

  // ─── Register ───────────────────────────────────────────────────────────

  const register = async ({ username, displayName, password }) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Generate RSA-OAEP keypair
      const { publicKey, privateKey } = await generateRSAKeyPair()

      // 2. Generate salt
      const saltBase64 = generateSalt()

      // 3. Wrap private key
      const wrappedKeyBase64 = await wrapPrivateKey(privateKey, password, saltBase64)

      // 4. Export public key
      const publicBase64 = await exportPublicKey({ publicKey }) // Passed as object matching the destructured keypair

      // 5. Send to API
      await authApi.register({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim() || username.trim(),
        password,
        public_key: publicBase64,
        wrapped_private_key: wrappedKeyBase64,
        pbkdf2_salt: saltBase64,
      })

      return true
    } catch (err) {
      setError(parseApiError(err, 'Registration failed.'))
      return false
    } finally {
      setLoading(false)
    }
  }

  // ─── Login ──────────────────────────────────────────────────────────────

  const login = async ({ username, password }) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Call login endpoint
      const { data } = await authApi.login({ username, password })

      // 2. Store tokens
      storeLogin(data)

      // 3. Initialize keys in memory via keyStore
      await initKeys(data, password)

      // 4. Open WebSocket
      socketService.connect(data.access_token)

      navigate('/chat', { replace: true })
      return true
    } catch (err) {
      setError(parseApiError(err, 'Login failed. Check your credentials.'))
      return false
    } finally {
      setLoading(false)
    }
  }

  // ─── Logout ─────────────────────────────────────────────────────────────

  const logout = async () => {
    setLoading(true)
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => { })
      }
    } finally {
      socketService.disconnect()
      storeLogout()
      clearKeys()
      setLoading(false)
      navigate('/login', { replace: true })
    }
  }

  return { register, login, logout, loading, error, clearError: () => setError(null) }
}
