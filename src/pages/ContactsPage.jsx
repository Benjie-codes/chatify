/**
 * ContactsPage — placeholder.
 * Full implementation (user search + contact list) comes in the contacts phase.
 */
function ContactsPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-10 w-full max-w-md text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Contacts</h1>
        <p className="text-sm text-slate-400">
          Search for users and start encrypted conversations.
        </p>

        {/* Search placeholder */}
        <div className="mt-8">
          <input
            className="input text-center"
            type="text"
            placeholder="Search users..."
            disabled
          />
        </div>

        <p className="mt-6 text-xs text-slate-600">
          Contact search coming soon
        </p>
      </div>
    </div>
  )
}

export default ContactsPage
