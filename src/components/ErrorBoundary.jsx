import React, { Component } from 'react'

/**
 * ErrorBoundary — catches unhandled render errors anywhere in the tree.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Custom error UI</p>}>
 *     ...
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
          <div className="glass rounded-3xl p-8 max-w-md w-full text-center animate-fade-in">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-danger-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-400 mb-2">
              An unexpected error occurred. Your messages are safe.
            </p>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs text-danger-400 bg-surface-900 rounded-xl p-4 mb-6 overflow-auto max-h-40 font-mono">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="flex gap-3 justify-center">
              <button
                className="btn-primary"
                onClick={this.handleReset}
              >
                Try again
              </button>
              <button
                className="btn-ghost"
                onClick={() => window.location.reload()}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
