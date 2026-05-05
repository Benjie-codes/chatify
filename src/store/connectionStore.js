/**
 * connectionStore — tracks the WebSocket connection state.
 * Read by ConnectionStatus component; written to by socket.js.
 * No persistence — state is always derived from live socket.
 */
import { create } from 'zustand'

/**
 * @typedef {'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'} ConnectionStatus
 */

const useConnectionStore = create((set) => ({
  /** @type {ConnectionStatus} */
  status: 'idle',

  /** Human-readable label shown in the UI */
  label: 'Not connected',

  /** Retry attempt count (for display purposes) */
  retryCount: 0,

  setStatus: (status, retryCount = 0) => {
    const labels = {
      idle:          'Not connected',
      connecting:    'Connecting…',
      connected:     'Connected',
      reconnecting:  `Reconnecting… (${retryCount})`,
      disconnected:  'Disconnected',
      error:         'Connection error',
    }
    set({ status, label: labels[status] ?? status, retryCount })
  },
}))

export default useConnectionStore
