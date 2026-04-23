import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children: React.ReactNode
  /** If set, only users with access_level <= maxLevel are allowed */
  maxLevel?: number
  /** If set, only the exact access_level is allowed */
  exactLevel?: number
}

/**
 * Wraps any route that requires authentication.
 * Redirects unauthenticated users to /login.
 * Optionally restricts by role level.
 */
export default function ProtectedRoute({ children, maxLevel, exactLevel }: Props) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const level = user?.role.access_level ?? 99

  if (maxLevel !== undefined && level > maxLevel) {
    return <Navigate to="/" replace />
  }

  if (exactLevel !== undefined && level !== exactLevel) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
