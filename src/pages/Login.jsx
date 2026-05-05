import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

// Sub-components
function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-900 mb-1.5">
      {children}
    </label>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className="input"
    />
  )
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="mb-6 flex items-start gap-3 rounded-[10px] bg-red-50 border border-red-100 px-4 py-3 animate-fade-in">
      <p className="text-sm text-red-600 flex-1">{message}</p>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">×</button>
    </div>
  )
}

function SocialButton({ children }) {
  return (
    <button type="button" className="flex-1 py-3 border-[1.5px] border-slate-200 rounded-[10px] flex items-center justify-center hover:bg-slate-50 transition-colors">
      <span className="font-bold text-slate-700">{children}</span>
    </button>
  )
}

function Login() {
  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  const { register, login, loading: isLoading, error, clearError } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    await login({ username: username.trim().toLowerCase(), password })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegSuccess(false)
    const success = await register({
      username: username.trim(),
      displayName: displayName.trim(),
      password,
    })
    
    if (success) {
      setRegSuccess(true)
      setMode('login')
      setPassword('')
    }
  }

  const switchMode = (next) => {
    setMode(next)
    clearError()
    setRegSuccess(false)
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      
      {/* Left Panel - Branding (Sticky) */}
      <div className="hidden md:flex flex-col justify-between w-[50%] max-w-[620px] h-screen sticky top-0 shrink-0 p-12 lg:p-16 relative overflow-hidden text-white">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/src/assets/gryd-gradient.png')" }}
        />
        {/* Fallback gradient if image fails/is missing */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5BE9FF] via-[#7B6FFF] to-[#2D0FA6] opacity-0 mix-blend-overlay" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="text-4xl font-bold">✳</div>
          
          <div className="mt-auto pb-4">
            <p className="text-base font-medium text-white/90 mb-3">Chatify is secured</p>
            <h1 className="font-serif text-4xl lg:text-5xl leading-tight text-white">
              {mode === 'login' ? 'Welcome back to your personal hub' : 'Get access your personal hub for clarity and productivity'}
            </h1>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (Scrollable) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 bg-white">
        <div className="w-full max-w-md mx-auto animate-fade-in">
          <div className="text-primary-500 text-3xl font-bold mb-6 md:hidden">✳</div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-base text-muted mb-10">
            {mode === 'login' 
              ? 'Enter your details to access your account.' 
              : 'Access your tasks, notes, and projects anytime, anywhere.'}
          </p>

          {regSuccess && (
            <div className="mb-6 rounded-[10px] bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              Account created successfully! Please sign in.
            </div>
          )}

          <ErrorBanner message={error} onDismiss={clearError} />

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6" noValidate>
            
            {mode === 'register' && (
              <div className="animate-fade-in">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  type="text"
                  placeholder="Alice Wonderland"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="alice_92"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-4 mt-4 bg-primary-600 hover:bg-primary-600 text-white font-semibold rounded-[10px] transition-colors disabled:opacity-50 text-lg shadow-sm"
            >
              {isLoading 
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'login' ? 'Sign in' : 'Get Started')}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-slate-500 mt-8">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-primary-500 hover:text-primary-600 focus:outline-none"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login
