/**
 * ChatPage — placeholder.
 * Full implementation (conversation list + message thread + WebSocket) comes in the chat phase.
 */
function ChatPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">Chatify</span>
          </div>
          <button className="btn-ghost p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>

        {/* Conversation list placeholder */}
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-slate-600 text-center">
            Conversations will appear here
          </p>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Select a conversation</h2>
          <p className="text-sm text-slate-500">Choose a contact to start chatting securely</p>
        </div>
      </main>
    </div>
  )
}

export default ChatPage
