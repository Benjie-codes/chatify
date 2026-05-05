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
  setConversationHistory: (userId, messages) => set((state) => ({
    conversations: {
      ...state.conversations,
      [userId]: [...messages].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    }
  })),

  /**
   * Clear everything on logout.
   */
  clearChat: () => set({ conversations: {}, activeContactId: null })
}))

export default useChatStore
