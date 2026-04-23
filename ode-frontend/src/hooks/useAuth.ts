import { useAuthStore } from '../stores/authStore'

/**
 * Convenience hook — returns auth state and helpers.
 * Usage: const { user, isAuthenticated, logout } = useAuth()
 */
export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore()

  const isAdmin     = (user?.role.access_level ?? 99) <= 1
  const isAffiliate = user?.role.access_level === 6
  const isAgent     = user?.role.access_level === 7
  const isPlanner   = user?.role.access_level === 8
  const isCustomer  = user?.role.access_level === 5

  return { user, token, isAuthenticated, setAuth, logout, isAdmin, isAffiliate, isAgent, isPlanner, isCustomer }
}
