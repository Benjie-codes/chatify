/**
 * SystemMessage.jsx
 * 
 * Renders an informational system message in the chat timeline (e.g. "X invited Y")
 */
import React from 'react'

export function SystemMessage({ text }) {
  return (
    <div className="flex justify-center items-center gap-1.5 my-6">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs text-muted">{text}</span>
    </div>
  )
}
