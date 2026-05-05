/**
 * EncryptionBadge.jsx
 * 
 * Shows the E2EE status in the chat topbar.
 */
import React from 'react'

export function EncryptionBadge({ isSecure }) {
  if (isSecure) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50/50 border border-accent-100 rounded-full cursor-help" title="End-to-End Encrypted">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
        <span className="text-[11px] font-bold text-accent-600 tracking-wide">E2EE</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/50 border border-amber-100 rounded-full cursor-help" title="Contact public key not found">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span className="text-[11px] font-bold text-amber-600 tracking-wide">Key unavailable</span>
    </div>
  )
}
