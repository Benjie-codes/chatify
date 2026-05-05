import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContactItem } from '../components/ContactItem'
import { MessageBubble } from '../components/MessageBubble'
import { EncryptionBadge } from '../components/EncryptionBadge'
import { TypingIndicator } from '../components/TypingIndicator'
import { ToastContainer, useToastStore } from '../components/Toast'
import { SystemMessage } from '../components/SystemMessage'
import useAuthStore from '../store/authStore'
import useKeyStore from '../store/keyStore'
import useChatStore from '../store/chatStore'
import { useMessaging } from '../hooks/useMessaging'
import { useAuth } from '../hooks/useAuth'
import { searchUsers } from '../services/api'

/**
 * SECURITY HARDENING CHECKLIST:
 * [x] Private key never leaves IndexedDB (Memory-only enforced by keyStore design)
 * [x] No sensitive data in localStorage or sessionStorage (Checked authStore/keyStore)
 * [x] IV freshly generated per message (See messageCrypto.js)
 * [x] Decryption failures caught and rendered gracefully (See messageCrypto.js & MessageBubble.jsx)
 * [x] WebSocket reconnects without re-prompting credentials (See socket.js auto-reconnect)
 * [x] All user input validated and sanitized before encrypt/send (Enforced below in handleSend)
 * [x] EncryptionBadge always visible in chat topbar (Rendered below)
 */
export default function ChatPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { sendMessage, getContactPublicKey, loadConversations, loadHistory } = useMessaging()
  
  const user = useAuthStore(s => s.user)
  const isKeyReady = useKeyStore(s => s.isReady)
  const isConnected = true // Mock connection status for now; in reality get from connectionStore

  const conversations = useChatStore(s => s.conversations)
  const contacts = useChatStore(s => s.contacts)
  const activeContactId = useChatStore(s => s.activeContactId)
  const setActiveContactId = useChatStore(s => s.setActiveContactId)
  const setContacts = useChatStore(s => s.setContacts)
  
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSecure, setIsSecure] = useState(false)
  const messagesEndRef = useRef(null)

  // Filter contacts locally when not searching the backend
  const filteredContacts = contacts.filter(c => 
    (c.display_name || c.username).toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeContact = contacts.find(c => c.id === activeContactId) || searchResults.find(c => c.id === activeContactId)

  // Debounced API Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await searchUsers(searchQuery)
        setSearchResults(data)
      } catch (err) {
        console.error('Failed to search users:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Initial load of conversations
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    scrollToBottom()
  }, [conversations, activeContactId])

  // Load history and check E2EE key availability when active contact changes
  useEffect(() => {
    if (activeContactId) {
      loadHistory(activeContactId)
      getContactPublicKey(activeContactId)
        .then(() => setIsSecure(true))
        .catch(() => setIsSecure(false))
    }
  }, [activeContactId, getContactPublicKey, loadHistory])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || !activeContactId) return

    // Security Hardening: Strip null bytes
    let sanitized = inputText.replace(/\0/g, '')
    // Enforce 5000 char max
    if (sanitized.length > 5000) {
      sanitized = sanitized.substring(0, 5000)
    }

    try {
      await sendMessage(activeContactId, sanitized)
      setInputText('')
    } catch (err) {
      useToastStore.getState().addToast('Failed to send — please retry', 'red')
    }
  }

  const handleSelectContact = (contact) => {
    // Add to local contacts if not present so it shows up in the normal list
    if (!contacts.find(c => c.id === contact.id)) {
      setContacts([contact, ...contacts])
    }
    setActiveContactId(contact.id)
    setSearchQuery('')
  }

  // Handle Full-Screen Loading State
  if (!isKeyReady) {
    return (
      <div className="min-h-screen bg-chatbg flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing end-to-end encryption keys...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-chatbg font-sans">
      <ToastContainer />

      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-[320px] shrink-0 bg-sidebar flex flex-col h-full border-r border-slate-800">
        
        {/* Sidebar Header (Current User) */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.display_name?.substring(0,2).toUpperCase() || 'ME'}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-500 border-2 border-sidebar rounded-full" />
            </div>
            <div>
              <h2 className="text-white font-medium text-[15px]">{user?.display_name || 'My Account'}</h2>
              <p className="text-muted text-[12px]">Available</p>
            </div>
          </div>
          
          <button onClick={logout} className="p-2 text-muted hover:text-white transition-colors" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Sidebar Nav Icons */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-white/5">
          <button className="text-white p-2 bg-white/10 rounded-lg"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg></button>
          <button className="text-muted hover:text-white p-2 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg></button>
          <button className="text-muted hover:text-white p-2 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
          <button className="text-muted hover:text-white p-2 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg></button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#2A2442] text-white text-sm rounded-lg py-2.5 pl-10 pr-4 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {searchQuery.trim() ? (
            isSearching ? (
              <div className="p-4 text-sm text-slate-400 text-center animate-pulse">Searching global network...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(contact => (
                <ContactItem 
                  key={contact.id}
                  name={contact.display_name || contact.username}
                  preview={`@${contact.username}`}
                  time=""
                  unreadCount={0}
                  isOnline={contact.is_online}
                  isActive={activeContactId === contact.id}
                  onClick={() => handleSelectContact(contact)}
                />
              ))
            ) : (
              <div className="p-4 text-sm text-slate-500 text-center">No users found.</div>
            )
          ) : (
            filteredContacts.map(contact => (
              <ContactItem 
                key={contact.id}
                name={contact.display_name || contact.username}
                preview={contact.last_message || 'Start a conversation...'}
                time={contact.last_message_time ? new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                unreadCount={contact.unread_count || 0}
                isOnline={contact.is_online}
                isActive={activeContactId === contact.id}
                onClick={() => handleSelectContact(contact)}
              />
            ))
          )}
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 flex flex-col h-full bg-white md:bg-chatbg">
        {activeContactId ? (
          <>
            {/* Chat Topbar */}
            <header className="h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                  {(activeContact?.display_name || activeContact?.username || 'U').substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-slate-900 font-semibold text-[15px]">{activeContact?.display_name || activeContact?.username}</h2>
                  <p className="text-slate-500 text-[12px]">{activeContact?.is_online ? 'Online' : 'Offline'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <EncryptionBadge isSecure={isSecure} />
                <button className="hidden sm:block px-4 py-1.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-full hover:bg-slate-50 transition-colors">
                  Invite
                </button>
                <button className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Message Timeline */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <SystemMessage text={`You started a secure conversation with ${activeContact?.display_name || activeContact?.username}`} />
              
              {conversations[activeContactId]?.map((msg, idx) => (
                <MessageBubble 
                  key={msg.id || idx}
                  text={msg.decryptedText}
                  sender={msg.senderId === user.id ? user.display_name : (activeContact?.display_name || activeContact?.username)}
                  time={new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  isSent={msg.senderId === user.id}
                  avatarInitials={(msg.senderId === user.id ? user.display_name : (activeContact?.display_name || activeContact?.username || 'U')).substring(0, 2).toUpperCase()}
                />
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {/* <TypingIndicator names={['Rachel']} /> */}

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3 bg-[#F4F5F8] px-2 py-2 rounded-full border border-slate-200/60">
                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Write a message"
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-800 placeholder:text-slate-500"
                />

                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm">End-to-end encrypted messaging.</p>
          </div>
        )}
      </main>
    </div>
  )
}
