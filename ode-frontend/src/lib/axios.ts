import axios from 'axios'

// Relative URL routes through Vite proxy in dev; set VITE_API_URL for production
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ode_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to /login when a token expires (401 on a normal API call).
// IMPORTANT: skip the auth endpoints — a 401 from /auth/login means "wrong
// password" and must be handled inline by the login form, NOT trigger a hard
// page reload (which would wipe the form and hide the error message).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = (error.config?.url ?? '') as string
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('ode_token')
      // Avoid a redirect loop if we're already on the login page.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
