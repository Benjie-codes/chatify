/**
 * chatStore — manages conversation list and per-conversation message history.
 *
 * Messages stored here are DECRYPTED (plaintext) objects — decryption happens
 * in the message handler before calling addMessage().
 */

import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────

  /** Array of ConversationSummary objects from GET /conversations */
  conversations: [],

  /**
   * Map of userId → MessageResponse[] (decrypted, newest-last for display)
   * @type {Record<string, Array>}
   */
  messages: {},

  /** UUID of the currently open conversation partner */
  activeConversationId: null,

  /** Tracks online presence: Set of user UUIDs currently online */
  onlineUsers: new Set(),

  // ─── Conversation Actions ──────────────────────────────────────────────────

  setConversations: (conversations) => set({ conversations }),

  /**
   * Upsert a conversation summary (e.g. after sending a first message).
   */
  upsertConversation: (summary) => {
    set((state) => {
      const existing = state.conversations.findIndex(
        (c) => c.user_id === summary.user_id
      )
      if (existing !== -1) {
        const updated = [...state.conversations]
        updated[existing] = summary
        // Re-sort by last_message_at descending
        updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
        return { conversations: updated }
      }
      return { conversations: [summary, ...state.conversations] }
    })
  },

  setActiveConversation: (userId) => set({ activeConversationId: userId }),

  // ─── Message Actions ───────────────────────────────────────────────────────

  /**
   * Bulk-load historical messages for a conversation (from GET /conversations/:id/messages).
   * API returns newest-first; we reverse to display oldest-first.
   *
   * @param {string} userId - Conversation partner UUID
   * @param {Array}  msgs   - Array of decrypted message objects
   */
  setMessages: (userId, msgs) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: [...msgs].reverse(),
      },
    }))
  },

  /**
   * Prepend older messages (from pagination) to an existing conversation.
   *
   * @param {string} userId
   * @param {Array}  olderMsgs - Already reversed to oldest-first order
   */
  prependMessages: (userId, olderMsgs) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: [...olderMsgs, ...(state.messages[userId] ?? [])],
      },
    }))
  },

  /**
   * Append a single new message (real-time or sent).
   *
   * @param {string} userId
   * @param {object} message - Decrypted message object
   */
  addMessage: (userId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [userId]: [...(state.messages[userId] ?? []), message],
      },
    }))
  },

  getMessages: (userId) => get().messages[userId] ?? [],

  // ─── Presence Actions ─────────────────────────────────────────────────────

  setUserOnline: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.add(userId)
      return { onlineUsers: next }
    })
  },

  setUserOffline: (userId) => {
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.delete(userId)
      return { onlineUsers: next }
    })
  },

  isUserOnline: (userId) => get().onlineUsers.has(userId),

  // ─── Reset ────────────────────────────────────────────────────────────────
  reset: () =>
    set({
      conversations: [],
      messages: {},
      activeConversationId: null,
      onlineUsers: new Set(),
    }),
}))

export default useChatStore
