import { useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import socketService from '../services/socket'
import { messagesApi, usersApi } from '../services/api'
import useAuthStore from '../store/authStore'
import useKeyStore from '../store/keyStore'
import useChatStore from '../store/chatStore'
import { encryptMessage, decryptMessage, importPublicKey } from '../crypto'

export function useMessaging() {
  const user = useAuthStore((s) => s.user)
  const myPrivateKey = useKeyStore((s) => s.privateKey)
  const myPublicKey = useKeyStore((s) => s.publicKey)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus)

  // Cache for imported CryptoKey public keys: { [userId]: CryptoKey }
  const contactKeysCache = useRef(new Map())

  // ─── Key Management ───────────────────────────────────────────────────────

  /**
   * Fetch and import a user's public key, caching it in memory.
   * @param {string} userId 
   * @returns {Promise<CryptoKey>}
   */
  const getContactPublicKey = async (userId) => {
    if (contactKeysCache.current.has(userId)) {
      return contactKeysCache.current.get(userId)
    }

    try {
      const { data } = await usersApi.getPublicKey(userId)
      const importedKey = await importPublicKey(data.public_key)
      contactKeysCache.current.set(userId, importedKey)
      return importedKey
    } catch (err) {
      console.error(`[useMessaging] Failed to fetch public key for user ${userId}`, err)
      throw err
    }
  }

  // ─── Sending Messages ─────────────────────────────────────────────────────

  /**
   * Encrypt and send a plaintext message to a recipient.
   * @param {string} recipientId 
   * @param {string} plaintext 
   */
  const sendMessage = async (recipientId, plaintext) => {
    if (!myPrivateKey || !myPublicKey || !user) {
      console.error('[useMessaging] Cannot send message: Crypto keys or user not ready.')
      return
    }

    const messageId = uuidv4()
    const tempMessage = {
      id: messageId,
      senderId: user.id,
      decryptedText: plaintext,
      timestamp: new Date().toISOString(),
      status: 'sending'
    }

    // Optimistically add to UI
    addMessage(recipientId, tempMessage)

    try {
      // 1. Get recipient's public key
      const recipientPublicKey = await getContactPublicKey(recipientId)

      // 2. Encrypt the payload
      const payload = await encryptMessage(plaintext, recipientPublicKey, myPublicKey)

      // 3. Send via WebSocket
      const sent = socketService.send({
        event: 'message.send',
        to: recipientId,
        payload
      })

      if (sent) {
        updateMessageStatus(recipientId, messageId, 'sent')
      } else {
        updateMessageStatus(recipientId, messageId, 'error')
      }
    } catch (error) {
      console.error('[useMessaging] Error sending message:', error)
      updateMessageStatus(recipientId, messageId, 'error')
    }
  }

  // ─── Receiving Messages ───────────────────────────────────────────────────

  useEffect(() => {
    if (!myPrivateKey || !user) return

    const handleIncomingMessage = async (data) => {
      // Validation
      if (!data.id || !data.from_user_id || !data.payload) {
        console.warn('[useMessaging] Malformed message received:', data)
        return
      }

      const isSender = data.from_user_id === user.id
      const conversationId = isSender ? data.to_user_id : data.from_user_id

      // Decrypt
      const decryptedText = await decryptMessage(data.payload, myPrivateKey, isSender)

      const messageObj = {
        id: data.id,
        senderId: data.from_user_id,
        payload: data.payload,
        decryptedText: decryptedText ?? '[Decryption failed]',
        timestamp: data.created_at || new Date().toISOString(),
        status: data.delivered ? 'delivered' : 'sent'
      }

      addMessage(conversationId, messageObj)
    }

    // Register listener on the socket service
    socketService.on('message.receive', handleIncomingMessage)

    // Cleanup listener on unmount
    return () => {
      socketService.off('message.receive', handleIncomingMessage)
    }
  }, [myPrivateKey, user, addMessage])

  return { sendMessage, getContactPublicKey }
}
