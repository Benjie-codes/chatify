/**
 * ContactItem.jsx
 * 
 * Renders a single contact row in the sidebar.
 */
import React from 'react'

export function ContactItem({ 
  name, 
  preview, 
  time, 
  unreadCount, 
  isActive, 
  onClick,
  avatarColor = 'bg-primary-600',
  isOnline = false
}) {
  const initials = name.substring(0, 2).toUpperCase()

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
        ${isActive ? 'bg-white/5' : 'hover:bg-white/5'}
      `}
    >
      {/* Active Indicator Border */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-500 rounded-r-md" />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${avatarColor}`}>
          {initials}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-500 border-2 border-sidebar rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-[15px] font-medium text-white truncate pr-2">{name}</h3>
          <span className="text-[11px] text-muted shrink-0">{time}</span>
        </div>
        <p className={`text-[13px] truncate ${isActive ? 'text-white/80' : 'text-muted'}`}>
          {preview}
        </p>
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-glow-primary">
          {unreadCount}
        </div>
      )}
      
      {/* Read receipt tick (if no unread and active, or whatever design needs) */}
      {unreadCount === 0 && isActive && (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  )
}
