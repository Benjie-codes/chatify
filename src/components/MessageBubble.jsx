/**
 * MessageBubble.jsx
 * 
 * Renders a single chat message bubble with distinct styles for sent vs received.
 * Also handles the decryption failure state gracefully without crashing.
 */
import React from 'react'

export function MessageBubble({ 
  text, 
  sender, 
  time, 
  isSent, 
  avatarInitials, 
  avatarColor = 'bg-primary-600' 
}) {
  const isDecryptionFailed = text === '[Decryption failed]' || text === null

  // Format the time string (e.g. "8 min" or real time if provided)
  const displayTime = time || ''

  return (
    <div className={`flex w-full mb-4 ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[75%] ${isSent ? 'items-end' : 'items-start'}`}>
        
        {/* The Bubble */}
        <div 
          className={`
            px-4 py-3 
            ${isSent 
              ? 'bg-primary-500 text-white rounded-2xl rounded-br-[4px]' 
              : 'bg-primary-50 text-slate-900 rounded-2xl rounded-bl-[4px]'
            }
          `}
        >
          {isDecryptionFailed ? (
            <span className="italic text-red-500 text-sm">
              [Unable to decrypt this message]
            </span>
          ) : (
            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
              {text}
            </p>
          )}
        </div>

        {/* The Metadata Row */}
        <div className={`flex items-center gap-2 mt-1.5 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar (only show on received messages based on design, but we can show everywhere) */}
          {!isSent && (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${avatarColor}`}>
              {avatarInitials}
            </div>
          )}
          
          <div className="flex items-baseline gap-1.5">
            {!isSent && (
              <span className="text-xs font-medium text-slate-700">{sender}</span>
            )}
            <span className="text-[11px] text-slate-400">{displayTime}</span>
          </div>
        </div>

      </div>
    </div>
  )
}
