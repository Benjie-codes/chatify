/**
 * Toast.jsx
 * 
 * Simple global toast notification component.
 * To use efficiently without adding a complex library, we'll expose a simple state interface
 * or use Zustand for toast state. For simplicity, we can create a custom hook or just 
 * a store for toasts.
 */
import React, { useEffect } from 'react'
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = uuidv4()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}))

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const bgColors = {
          info: 'bg-slate-800 text-white',
          amber: 'bg-amber-500 text-white shadow-glow-amber',
          red: 'bg-red-500 text-white shadow-glow-red'
        }

        return (
          <div 
            key={toast.id}
            className={`min-w-[280px] px-4 py-3 rounded-[10px] shadow-lg flex items-start gap-3 animate-slide-up cursor-pointer ${bgColors[toast.type] || bgColors.info}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button className="text-white/60 hover:text-white">×</button>
          </div>
        )
      })}
    </div>
  )
}
