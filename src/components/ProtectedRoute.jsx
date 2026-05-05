/**
 * ProtectedRoute — redirects to /login if the user is not authenticated
 * or if the crypto session (private key) is not ready.
 */
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useKeyStore from '../store/keyStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isKeyReady = useKeyStore((s) => s.isReady)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Key not in memory — user must log in again to restore the session
  if (!isKeyReady) {
    return <Navigate to="/login" state={{ from: location, reason: 'session_expired' }} replace />
  }

  return children
}

export default ProtectedRoute
