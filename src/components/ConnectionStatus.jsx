/**
 * ConnectionStatus — animated dot indicator for WebSocket connection state.
 *
 * States:
 *   connected    → green pulse
 *   connecting   → amber pulse (slow)
 *   reconnecting → amber pulse (fast) + retry count
 *   disconnected → red static
 *   error        → red static
 *   idle         → grey static
 */

import useConnectionStore from '../store/connectionStore'

const config = {
  connected: {
    dot:   'bg-accent-400',
    ring:  'bg-accent-400/30',
    pulse: 'animate-ping',
    text:  'text-accent-400',
  },
  connecting: {
    dot:   'bg-amber-400',
    ring:  'bg-amber-400/30',
    pulse: 'animate-ping',
    text:  'text-amber-400',
  },
  reconnecting: {
    dot:   'bg-amber-400',
    ring:  'bg-amber-400/30',
    pulse: 'animate-ping',
    text:  'text-amber-400',
  },
  disconnected: {
    dot:   'bg-danger-500',
    ring:  '',
    pulse: '',
    text:  'text-danger-400',
  },
  error: {
    dot:   'bg-danger-500',
    ring:  '',
    pulse: '',
    text:  'text-danger-400',
  },
  idle: {
    dot:   'bg-slate-500',
    ring:  '',
    pulse: '',
    text:  'text-slate-500',
  },
}

function ConnectionStatus({ showLabel = false, className = '' }) {
  const { status, label } = useConnectionStore()
  const c = config[status] ?? config.idle

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      title={label}
      aria-label={`Connection status: ${label}`}
    >
      {/* Dot + ring */}
      <span className="relative flex h-2.5 w-2.5">
        {c.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${c.ring} ${c.pulse}`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${c.dot}`} />
      </span>

      {showLabel && (
        <span className={`text-xs font-medium ${c.text}`}>{label}</span>
      )}
    </div>
  )
}

export default ConnectionStatus
