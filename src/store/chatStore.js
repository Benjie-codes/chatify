import { create } from 'zustand'

/**
 * chatStore — Manages message history and active conversations in-memory.
 */
const useChatStore = create((set, get) => ({
  // Map of userId -> Array of Message objects
  conversations: {},

  // Current selected contact ID in the UI
  activeContactId: null,

  // Contacts populated from the API
  contacts: [],

  setContacts: (contacts) => set({ contacts }),

  setActiveContactId: (id) => set({ activeContactId: id }),

  /**
   * Add a new message (incoming or outgoing) to a conversation.
   * If the conversation doesn't exist, it is created.
   * 
   * @param {string} userId - The other participant's ID
   * @param {Object} message - { id, senderId, payload, decryptedText, timestamp, status }
   */
  addMessage: (userId, message) => set((state) => {
    const thread = state.conversations[userId] || []
    
    // Prevent duplicates (e.g. if we optimistically added it, and WS echoes it)
    if (thread.some(m => m.id === message.id)) {
      return {
        conversations: {
          ...state.conversations,
          [userId]: thread.map(m => m.id === message.id ? { ...m, ...message } : m)
        }
      }
    }

    // Append new message and sort by timestamp
    const updatedThread = [...thread, message].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return {
      conversations: {
        ...state.conversations,
        [userId]: updatedThread
      }
    }
  }),

  /**
   * Update the status of an existing message (e.g. sending -> sent).
   * 
   * @param {string} userId - The conversation ID
   * @param {string} messageId - The message ID
   * @param {string} status - 'sending' | 'sent' | 'delivered' | 'error'
   */
  updateMessageStatus: (userId, messageId, status) => set((state) => {
    const thread = state.conversations[userId]
    if (!thread) return state

    return {
      conversations: {
        ...state.conversations,
        [userId]: thread.map(m => m.id === messageId ? { ...m, status } : m)
      }
    }
  }),

  /**
   * Replace the entire conversation thread (used for loading history).
   */
  setConversationHistory: (userId, messages) => set((state) => {
    const existingThread = state.conversations[userId] || []
    
    // Create a map to deduplicate by ID, keeping optimistic messages that haven't been echoed
    const mergedMap = new Map()
    existingThread.forEach(m => mergedMap.set(m.id, m))
    messages.forEach(m => mergedMap.set(m.id, m))

    return {
      conversations: {
        ...state.conversations,
        [userId]: Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      }
    }
  }),

  /**
   * Update a contact's online status in real-time.
   */
  setContactStatus: (userId, isOnline) => set((state) => ({
    contacts: state.contacts.map(c => 
      String(c.id) === String(userId) ? { ...c, is_online: isOnline } : c
    )
  })),

  /**
   * Confirm an optimistic message: replace the most recent 'sending'/'sent' temp message
   * in a conversation with the real backend-confirmed message. Used when the backend
   * echoes back our own sent message so we don't render duplicates.
   */
  confirmOptimisticMessage: (conversationId, confirmedMessage) => set((state) => {
    const thread = state.conversations[conversationId] || []
    // Find the most recent temp message that matches the decrypted text (same content)
    const tempIdx = [...thread].reverse().findIndex(
      m => (m.status === 'sending' || m.status === 'sent') &&
           m.decryptedText === confirmedMessage.decryptedText
    )
    if (tempIdx === -1) {
      // No matching optimistic message — just add normally
      const updatedThread = [...thread, confirmedMessage].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      return { conversations: { ...state.conversations, [conversationId]: updatedThread } }
    }
    // Replace the optimistic message with the confirmed one
    const realIdx = thread.length - 1 - tempIdx
    const updatedThread = thread.map((m, i) => i === realIdx ? { ...m, ...confirmedMessage } : m)
    return { conversations: { ...state.conversations, [conversationId]: updatedThread } }
  }),

  /**
   * Clear everything on logout.
   */
  clearChat: () => set({ conversations: {}, activeContactId: null })
}))

export default useChatStore
