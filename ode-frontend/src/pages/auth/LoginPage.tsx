import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { useAuthStore } from '../../stores/authStore'
import type { AuthResponse } from '../../types'
import AuthLayout from './AuthLayout'

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const setAuth   = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<AuthResponse>('/auth/login', data)
      setAuth(res.data.user, res.data.token)

      // Redirect to where they came from, or role-based default
      const from = (location.state as { from?: Location })?.from?.pathname
      const level = res.data.user.role.access_level

      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else if (level <= 2) {
        navigate('/admin', { replace: true })
      } else if (level === 6) {
        navigate('/affiliate', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }

      if (error.response?.status === 422) {
        const apiErrors = error.response.data?.errors ?? {}
        for (const [field, messages] of Object.entries(apiErrors)) {
          setError(field as keyof FormData, { message: messages[0] })
        }
      } else if (error.response?.status === 401) {
        setError('password', { message: 'Invalid email or password.' })
      } else if (error.response?.status === 403) {
        toast.error(error.response.data?.message ?? 'Account inactive.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
              ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
              ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#1CA0DF] hover:bg-[#1786BB] disabled:bg-[#1CA0DF]/50 text-white font-medium rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] focus:ring-offset-2"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-[#1CA0DF] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
