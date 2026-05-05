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
import { bufferToBase64, base64ToBuffer } from '../utils/encoding'
import {
  generateRSAKeyPair,
  generateSalt,
  deriveWrappingKey,
  wrapPrivateKey,
  unwrapPrivateKey,
  exportPublicKey,
  importPublicKey
} from '../crypto'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const storeLogin  = useAuthStore((s) => s.login)
  const storeLogout = useAuthStore((s) => s.logout)
  const token       = useAuthStore((s) => s.token)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  
  const setKeys     = useKeyStore((s) => s.setKeys)
  const clearKeys   = useKeyStore((s) => s.clearKeys)

  const navigate = useNavigate()

  // ─── Register ───────────────────────────────────────────────────────────

  const register = async ({ username, displayName, password }) => {
    setLoading(true)
    setError(null)
    try {
      // 1. Generate RSA-OAEP keypair
      const { publicKey, privateKey } = await generateRSAKeyPair()
      
      // 2. Generate salt and derive AES-KW wrapping key
      const saltBuffer = generateSalt()
      const wrappingKey = await deriveWrappingKey(password, saltBuffer)
      
      // 3. Wrap private key
      const wrappedKeyBuffer = await wrapPrivateKey(privateKey, wrappingKey)
      
      // 4. Export public key
      const publicBase64 = await exportPublicKey(publicKey)
      const wrappedKeyBase64 = bufferToBase64(wrappedKeyBuffer)
      const saltBase64 = bufferToBase64(saltBuffer)

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
      
      // 2. Extract key material
      const { wrapped_private_key, pbkdf2_salt, public_key } = data.user
      
      // 3. Re-derive wrapping key
      const saltBuffer = base64ToBuffer(pbkdf2_salt)
      const wrappingKey = await deriveWrappingKey(password, saltBuffer)
      
      // 4. Unwrap private key
      const wrappedKeyBuffer = base64ToBuffer(wrapped_private_key)
      const privateKey = await unwrapPrivateKey(wrappedKeyBuffer, wrappingKey)
      
      // 5. Import public key
      const publicKey = await importPublicKey(public_key)
      
      // 6. Store tokens and unwrapped keys
      storeLogin(data)
      setKeys(privateKey, publicKey)

      // 7. Open WebSocket
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
        await authApi.logout(refreshToken).catch(() => {})
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
