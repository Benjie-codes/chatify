import { useNavigate } from 'react-router-dom'
import ConnectionStatus from '../components/ConnectionStatus'
import useAuthStore from '../store/authStore'
import useConnectionStore from '../store/connectionStore'
import socketService from '../services/socket'
import { authApi } from '../services/api'

/**
 * ChatPage — two-column layout with sidebar + message area.
 * Real conversations/messages wired in the chat implementation phase.
 */
function ChatPage() {
  const user         = useAuthStore((s) => s.user)
  const storeLogout  = useAuthStore((s) => s.logout)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const { label }    = useConnectionStore()
  const navigate     = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken).catch(() => {})
    } finally {
      socketService.disconnect()
      storeLogout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="h-screen bg-surface-950 flex overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-white/10">

        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          {/* Brand + status */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-primary shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Chatify</p>
              {/* Connection status with label */}
              <ConnectionStatus showLabel className="mt-1" />
            </div>
          </div>

          {/* New chat button */}
          <button
            id="btn-new-chat"
            className="btn-ghost p-2 rounded-xl"
            title="New conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              id="search-conversations"
              type="search"
              placeholder="Search conversations…"
              className="input pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {/* Conversation list — placeholder */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-surface-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-xs text-slate-600 text-center">
              No conversations yet.<br />Start chatting with someone!
            </p>
          </div>
        </div>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase">
            {user?.display_name?.[0] ?? user?.username?.[0] ?? '?'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-none">
              {user?.display_name ?? 'Unknown'}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              @{user?.username ?? '—'}
            </p>
          </div>

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="btn-ghost p-2 rounded-xl text-slate-400 hover:text-danger-400"
            title="Log out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center min-w-0">
        <div className="text-center animate-fade-in px-6">
          <div className="w-20 h-20 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Select a conversation
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Pick an existing thread from the sidebar, or start a new encrypted conversation.
          </p>

          {/* Connection status detail */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800/60 border border-white/5">
            <ConnectionStatus />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChatPage
