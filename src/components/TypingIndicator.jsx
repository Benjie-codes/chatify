/**
 * TypingIndicator.jsx
 * 
 * Shows animated 3 dots and "X is typing..." text.
 */
import React from 'react'

export function TypingIndicator({ names }) {
  if (!names || names.length === 0) return null

  const text = names.length === 1 
    ? `${names[0]} is typing...`
    : `${names.join(' and ')} are typing...`

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-transparent animate-fade-in">
      <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-full shadow-sm border border-slate-100">
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
      </div>
      <span className="text-xs italic text-muted">{text}</span>
    </div>
  )
}
