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
  const confirmOptimisticMessage = useChatStore((s) => s.confirmOptimisticMessage)
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
      // ConversationSummary returns user_id (not id) — normalize to id so the rest of the UI works
      const normalized = data.map(c => ({ ...c, id: c.user_id }))
      setContacts(normalized)
    } catch (err) {
      console.error('[useMessaging] Failed to load conversations', err)
    }
  }, [setContacts])

  const loadHistory = useCallback(async (userId) => {
    if (!myPrivateKey || !user) return
    try {
      const { data } = await messagesApi.getMessages(userId)

      const decryptedMessages = await Promise.all(data.map(async (msg) => {
        let parsedPayload = msg.payload
        if (typeof parsedPayload === 'string') {
          try { parsedPayload = JSON.parse(parsedPayload) } catch (e) { }
        }

        // Validation check as requested
        if (!parsedPayload || !parsedPayload.ciphertext || !parsedPayload.iv || !parsedPayload.encryptedKey) {
          console.warn('[useMessaging] Malformed payload in history:', msg)
          return null
        }

        const isSender = String(msg.from_user_id) === String(user.id)
        const decryptedText = await decryptMessage(parsedPayload, myPrivateKey, isSender)

        return {
          id: msg.id || uuidv4(),
          senderId: msg.from_user_id,
          payload: parsedPayload,
          decryptedText: decryptedText ?? '[Decryption failed]',
          timestamp: msg.created_at || new Date().toISOString(),
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

      // 3a. Prefer WebSocket delivery (real-time) — backend broadcasts to recipient immediately
      //     WS frame format per OpenAPI spec: { event, to, payload }
      if (socketService.status === 'connected') {
        const sent = socketService.send({ event: 'message.send', to: recipientId, payload })
        if (sent) {
          updateMessageStatus(recipientId, messageId, 'sent')
          return
        }
      }

      // 3b. REST fallback — backend queues and delivers on recipient's next reconnect
      //     SendMessageRequest schema: { to: uuid, payload: EncryptedPayload }
      await messagesApi.sendMessage({ to: recipientId, payload })
      updateMessageStatus(recipientId, messageId, 'sent')
    } catch (error) {
      console.error('[useMessaging] Error sending message:', error)
      updateMessageStatus(recipientId, messageId, 'error')
    }
  }

  // ─── Receiving Messages & Presence ────────────────────────────────────────

  useEffect(() => {
    if (!myPrivateKey || !user) return

    const handlePresence = (rawEventData, isOnline) => {
      let actualData = rawEventData
      if (rawEventData && typeof rawEventData.data === 'object') actualData = rawEventData.data
      else if (rawEventData && typeof rawEventData.payload === 'object') actualData = rawEventData.payload

      const id = actualData.user_id || actualData.id || actualData.userId || actualData.from_user_id
      if (id) {
        useChatStore.getState().setContactStatus(id, isOnline)
      }
    }

    const handleOnline = (data) => handlePresence(data, true)
    const handleOffline = (data) => handlePresence(data, false)

    const handleIncomingMessage = async (rawEventData) => {
      // Aggressively un-nest the data
      let actualData = rawEventData
      if (rawEventData && typeof rawEventData.data === 'object') actualData = rawEventData.data
      else if (rawEventData && typeof rawEventData.message === 'object') actualData = rawEventData.message

      // The cryptographic payload might be nested under 'payload' or flattened into the root object
      let parsedPayload = actualData.payload || actualData
      if (typeof parsedPayload === 'string') {
        try { parsedPayload = JSON.parse(parsedPayload) } catch (e) { }
      }

      const fromUserId = actualData.from_user_id || actualData.sender_id || parsedPayload.from_user_id
      const toUserId = actualData.to_user_id || actualData.receiver_id || parsedPayload.to_user_id

      // Validation
      if (!fromUserId || !parsedPayload.ciphertext || !parsedPayload.iv || !parsedPayload.encryptedKey) {
        console.warn('[useMessaging] Ignored unreadable WS frame:', rawEventData)
        return
      }

      const isSender = String(fromUserId) === String(user.id)
      const conversationId = isSender ? String(toUserId) : String(fromUserId)

      if (isSender) {
        // The backend echoes our own sent frame back to us.
        // We already rendered it optimistically, so discard the echo.
        return
      }

      const decryptedText = await decryptMessage(parsedPayload, myPrivateKey, false)

      const messageObj = {
        id: actualData.id || actualData.message_id || parsedPayload.id || uuidv4(),
        senderId: String(fromUserId),
        payload: parsedPayload,
        decryptedText: decryptedText ?? '[Decryption failed]',
        timestamp: actualData.created_at || parsedPayload.created_at || new Date().toISOString(),
        status: actualData.delivered ? 'delivered' : 'sent'
      }

      addMessage(conversationId, messageObj)

      // Auto-refresh the sidebar if this is a new conversation
      const currentContacts = useChatStore.getState().contacts
      if (!currentContacts.some(c => String(c.id) === conversationId)) {
        loadConversations()
      }
    }

    // Only bind documented events per the WhisperBox OpenAPI spec
    socketService.on('message.receive', handleIncomingMessage)
    socketService.on('user.online', handleOnline)
    socketService.on('user.offline', handleOffline)
    socketService.on('presence', (data) => {
      const status = data.status || data.state
      handlePresence(data, status === 'online' || status === true)
    })

    return () => {
      socketService.off('message.receive', handleIncomingMessage)
      socketService.off('user.online', handleOnline)
      socketService.off('user.offline', handleOffline)
      socketService.off('presence', handlePresence)
    }
  }, [myPrivateKey, user, addMessage, loadConversations])

  return { sendMessage, loadConversations, loadHistory, getContactPublicKey }
}
