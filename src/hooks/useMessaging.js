import { useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import socketService from '../services/socket'
import { messagesApi } from '../services/api'
import useAuthStore from '../store/authStore'
import useKeyStore from '../store/keyStore'
import useChatStore from '../store/chatStore'
import { encryptMessage, decryptMessage } from '../crypto/messageCrypto'
import { fetchRecipientPublicKey } from '../crypto/keyExchange'

export function useMessaging() {
  const user = useAuthStore((s) => s.user)
  const myPrivateKey = useKeyStore((s) => s.privateKey)
  const myPublicKey = useKeyStore((s) => s.publicKey)
  
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus)
  const setContacts = useChatStore((s) => s.setContacts)
  const setConversationHistory = useChatStore((s) => s.setConversationHistory)

  /**
   * Fetch and import a user's public key, caching it in memory.
   * @param {string} userId 
   * @returns {Promise<CryptoKey>}
   */
  const getContactPublicKey = async (userId) => {
    try {
      return await fetchRecipientPublicKey(userId)
    } catch (err) {
      console.error(`[useMessaging] Failed to fetch public key for user ${userId}`, err)
      throw err
    }
  }

  // ─── Loading Conversations & History ──────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await messagesApi.getConversations()
      setContacts(data)
    } catch (err) {
      console.error('[useMessaging] Failed to load conversations', err)
    }
  }, [setContacts])

  const loadHistory = useCallback(async (userId) => {
    if (!myPrivateKey || !user) return
    try {
      const { data } = await messagesApi.getMessages(userId)
      
      const decryptedMessages = await Promise.all(data.map(async (msg) => {
        // Validation check as requested
        if (!msg.payload || !msg.payload.ciphertext || !msg.payload.iv || !msg.payload.encryptedKey) {
          console.warn('[useMessaging] Malformed payload in history:', msg)
          return null
        }

        const isSender = msg.from_user_id === user.id
        const decryptedText = await decryptMessage(msg.payload, myPrivateKey, isSender)
        
        return {
          id: msg.id,
          senderId: msg.from_user_id,
          payload: msg.payload,
          decryptedText: decryptedText ?? '[Decryption failed]',
          timestamp: msg.created_at,
          status: msg.delivered ? 'delivered' : 'sent'
        }
      }))
      
      const validMessages = decryptedMessages.filter(Boolean)
      setConversationHistory(userId, validMessages)
    } catch (err) {
      console.error(`[useMessaging] Failed to load history for user ${userId}`, err)
    }
  }, [myPrivateKey, user, setConversationHistory])

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

    // Sanitize plaintext input before encrypting: max 5000 chars, strip null bytes
    let sanitizedText = plaintext.replace(/\0/g, '')
    if (sanitizedText.length > 5000) {
      sanitizedText = sanitizedText.substring(0, 5000)
    }

    const messageId = uuidv4()
    const tempMessage = {
      id: messageId,
      senderId: user.id,
      decryptedText: sanitizedText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    }

    // Optimistically add to UI
    addMessage(recipientId, tempMessage)

    try {
      // 1. Get recipient's public key
      const recipientPublicKey = await getContactPublicKey(recipientId)

      // 2. Encrypt the payload
      const payload = await encryptMessage(sanitizedText, recipientPublicKey, myPublicKey)

      // 3. Send via WebSocket if connected, else POST fallback
      if (socketService.isConnected()) {
        const sent = socketService.send({
          event: 'message.send',
          to: recipientId,
          payload
        })

        if (sent) {
          updateMessageStatus(recipientId, messageId, 'sent')
        } else {
          throw new Error('WebSocket send failed')
        }
      } else {
        // Offline fallback
        console.warn('[useMessaging] WS disconnected, falling back to POST /messages')
        await messagesApi.sendMessage({
          to_user_id: recipientId,
          payload
        })
        updateMessageStatus(recipientId, messageId, 'sent')
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
      // Validation as requested: Reject any incoming WS message missing required fields
      if (!data.id || !data.from_user_id || !data.payload || !data.payload.ciphertext || !data.payload.iv || !data.payload.encryptedKey) {
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

  return { sendMessage, loadConversations, loadHistory, getContactPublicKey }
}
