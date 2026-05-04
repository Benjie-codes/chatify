import { Link } from 'react-router-dom'

/**
 * Login page — placeholder.
 * Full implementation (register/login form + crypto key setup) comes in the auth phase.
 */
function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-10 w-full max-w-sm text-center animate-slide-up">
        {/* Logo / brand */}
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Chatify</h1>
        <p className="text-sm text-slate-400 mb-8">End-to-end encrypted messaging</p>

        {/* Placeholder form */}
        <div className="space-y-4 text-left mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
            <input className="input" type="text" placeholder="alice_92" disabled />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input className="input" type="password" placeholder="••••••••" disabled />
          </div>
        </div>

        <button className="btn-primary w-full mb-4" disabled>
          Sign in
        </button>

        <p className="text-xs text-slate-500">
          Don't have an account?{' '}
          <span className="text-primary-400 cursor-pointer hover:text-primary-300 transition-colors">
            Register
          </span>
        </p>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-accent-500" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
            Keys never leave your device
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
