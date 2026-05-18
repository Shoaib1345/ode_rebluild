import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem('ode_token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('ode_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'ode-auth', // localStorage key
      // isAuthenticated MUST be persisted — without it the store rehydrates
      // with isAuthenticated=false on every refresh, causing ProtectedRoute
      // to redirect to /login before the token can be read.
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
