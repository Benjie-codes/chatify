/**
 * socket.js — Singleton WebSocket manager for WhisperBox.
 *
 * Connection URL: wss://whisperbox.koyeb.app/ws?token=<jwt>
 * (Browsers cannot set custom headers on WS upgrades, so the JWT is a query param.)
 *
 * Features:
 *   - connect(token) / disconnect()
 *   - send(eventObject)  — serialises to JSON
 *   - on(event, handler) / off(event, handler)  — typed event listeners
 *   - Auto-reconnect with exponential backoff (max MAX_RETRIES attempts)
 *   - Connection state broadcast via connectionStore
 */

import useConnectionStore from '../store/connectionStore'

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'wss://whisperbox.koyeb.app/ws'
const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000   // 1 s → 2 s → 4 s → 8 s → 16 s

class SocketService {
  constructor() {
    /** @type {WebSocket | null} */
    this.ws = null

    /** JWT stored for reconnect attempts */
    this._token = null

    /** Retry counter */
    this._retryCount = 0

    /** setTimeout handle for scheduled reconnect */
    this._retryTimer = null

    /** Whether disconnect() was called intentionally */
    this._intentionalClose = false

    /**
     * Event listener registry.
     * Keys: WhisperBox event names ('message.receive', 'user.online', etc.)
     *       plus the internal '__status' key used by onStatusChange().
     * @type {Map<string, Function[]>}
     */
    this._listeners = new Map()
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Open a WebSocket connection using the provided JWT.
   * Safe to call when already connected — will no-op.
   *
   * @param {string} token - JWT access token
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return

    this._token = token
    this._intentionalClose = false
    this._openSocket()
  }

  /**
   * Gracefully close the connection and cancel any pending reconnect.
   */
  disconnect() {
    this._intentionalClose = true
    this._clearRetryTimer()
    this._retryCount = 0

    if (this.ws) {
      this.ws.close(1000, 'Client logout')
      this.ws = null
    }

    this._setStatus('disconnected')
  }

  /**
   * Send a JSON-serialisable object to the server.
   * Silently drops the frame if the socket is not open.
   *
   * @param {object} data - e.g. { event: 'message.send', to: uuid, payload: {...} }
   * @returns {boolean} true if the frame was sent
   */
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[SocketService] send() called while not connected — frame dropped')
      return false
    }
    this.ws.send(JSON.stringify(data))
    return true
  }

  /**
   * Register a handler for a specific server event.
   *
   * Supported events:
   *   'message.receive' | 'user.online' | 'user.offline' | 'error'
   *
   * @param {string}   event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, [])
    this._listeners.get(event).push(handler)
  }

  /**
   * Remove a previously registered handler.
   *
   * @param {string}   event
   * @param {Function} handler
   */
  off(event, handler) {
    if (!this._listeners.has(event)) return
    this._listeners.set(
      event,
      this._listeners.get(event).filter((h) => h !== handler)
    )
  }

  /**
   * Register a handler that fires whenever the connection status changes.
   * Equivalent to on('__status', handler).
   *
   * @param {Function} handler - (status: string) => void
   */
  onStatusChange(handler) {
    this.on('__status', handler)
  }

  /** Remove a status-change handler. */
  offStatusChange(handler) {
    this.off('__status', handler)
  }

  /** Current connection status string */
  get status() {
    return useConnectionStore.getState().status
  }

  // ─── Private: socket lifecycle ───────────────────────────────────────────

  _openSocket() {
    this._setStatus(this._retryCount > 0 ? 'reconnecting' : 'connecting', this._retryCount)

    const url = `${WS_BASE_URL}?token=${encodeURIComponent(this._token)}`
    this.ws = new WebSocket(url)

    this.ws.onopen    = () => this._handleOpen()
    this.ws.onclose   = (ev) => this._handleClose(ev)
    this.ws.onmessage = (ev) => this._handleMessage(ev)
    this.ws.onerror   = (ev) => this._handleError(ev)
  }

  _handleOpen() {
    console.info('[SocketService] connected')
    this._retryCount = 0
    this._setStatus('connected')
  }

  _handleClose(event) {
    console.info(`[SocketService] closed — code ${event.code}, intentional: ${this._intentionalClose}`)

    if (this._intentionalClose) {
      this._setStatus('disconnected')
      return
    }

    // Unexpected close — attempt reconnect
    if (this._retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, this._retryCount)
      console.info(`[SocketService] reconnecting in ${delay}ms (attempt ${this._retryCount + 1}/${MAX_RETRIES})`)
      this._setStatus('reconnecting', this._retryCount + 1)

      this._retryTimer = setTimeout(() => {
        this._retryCount++
        this._openSocket()
      }, delay)
    } else {
      console.error('[SocketService] max retries reached — giving up')
      this._setStatus('error')
    }
  }

  _handleMessage(event) {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      console.warn('[SocketService] received non-JSON frame:', event.data)
      return
    }

    const eventName = data.event || data.type || data.action

    if (!eventName) {
      // Silently drop frames with no recognizable event name (e.g. heartbeats)
      return
    }

    // Emit with the original raw data so we don't accidentally strip properties
    this._emit(eventName, data)
  }

  _handleError(event) {
    console.error('[SocketService] WebSocket error:', event)
    // onclose fires immediately after onerror, so reconnect is handled there
  }

  // ─── Private: helpers ────────────────────────────────────────────────────

  _emit(event, payload) {
    const handlers = this._listeners.get(event)
    if (handlers) handlers.forEach((h) => h(payload))
  }

  _setStatus(status, retryCount = 0) {
    useConnectionStore.getState().setStatus(status, retryCount)
    this._emit('__status', status)
  }

  _clearRetryTimer() {
    if (this._retryTimer) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
    }
  }
}

// Export a singleton so all hooks share the same connection
const socketService = new SocketService()
export default socketService
