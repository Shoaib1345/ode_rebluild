import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { useAuthStore } from '../../stores/authStore'
import type { AuthResponse } from '../../types'
import AuthLayout from './AuthLayout'

const schema = z.object({
  first_name:            z.string().min(1, 'First name is required').max(55),
  last_name:             z.string().min(1, 'Last name is required').max(55),
  email:                 z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone:                 z.string().max(20).optional().or(z.literal('')),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<AuthResponse>('/auth/register', data)
      setAuth(res.data.user, res.data.token)
      toast.success('Account created! Welcome.')
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }

      if (error.response?.status === 422) {
        const apiErrors = error.response.data?.errors ?? {}
        for (const [field, messages] of Object.entries(apiErrors)) {
          setError(field as keyof FormData, { message: messages[0] })
        }
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AuthLayout title="Create an account" subtitle="Get your event insured in minutes">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              {...register('first_name')}
              type="text"
              autoComplete="given-name"
              className={`w-full px-3 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
                ${errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              placeholder="Jane"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last name
            </label>
            <input
              {...register('last_name')}
              type="text"
              autoComplete="family-name"
              className={`w-full px-3 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
                ${errors.last_name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              placeholder="Smith"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

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

        {/* Phone (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition"
            placeholder="(408) 555-0100"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
              ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            placeholder="Min. 8 characters"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            {...register('password_confirmation')}
            type="password"
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
              ${errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
            placeholder="••••••••"
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-xs text-red-600">{errors.password_confirmation.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#1CA0DF] hover:bg-[#1786BB] disabled:bg-[#1CA0DF]/50 text-white font-medium rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] focus:ring-offset-2 mt-2"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
