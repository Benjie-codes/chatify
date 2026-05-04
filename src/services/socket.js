/**
 * socket.js — WebSocket service stub.
 *
 * Full implementation (connect, event handling, reconnect logic) will be
 * added in a later phase. This file exports the shape so other modules
 * can import it without breaking.
 */

class SocketService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
  }

  /**
   * Connect to the WhisperBox WebSocket endpoint.
   * Token is passed as a query param (browsers can't set WS headers).
   *
   * @param {string} token - JWT access token
   */
  connect(token) {
    // TODO: implement in WebSocket phase
    console.info('[SocketService] connect() — not yet implemented')
  }

  /**
   * Disconnect and clean up.
   */
  disconnect() {
    // TODO: implement in WebSocket phase
    console.info('[SocketService] disconnect() — not yet implemented')
  }

  /**
   * Send a message.send event.
   *
   * @param {string} to      - Recipient UUID
   * @param {object} payload - EncryptedPayload { ciphertext, iv, encryptedKey, encryptedKeyForSelf }
   */
  sendMessage(to, payload) {
    // TODO: implement in WebSocket phase
    console.info('[SocketService] sendMessage() — not yet implemented')
  }

  /**
   * Register a listener for a specific event type.
   *
   * @param {string}   event    - e.g. 'message.receive', 'user.online'
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(handler)
  }

  /**
   * Remove a listener.
   */
  off(event, handler) {
    if (!this.listeners.has(event)) return
    this.listeners.set(
      event,
      this.listeners.get(event).filter((h) => h !== handler)
    )
  }
}

// Export a singleton so all hooks share the same connection
const socketService = new SocketService()
export default socketService
