import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { useAuthStore } from '../../stores/authStore'
import type { AuthResponse } from '../../types'

import logoImg    from '../../assets/logo-img.svg'
import logoText   from '../../assets/logo-text.svg'
import loginIcon1 from '../../assets/login-icon1.svg'
import loginIcon2 from '../../assets/login-icon2.svg'
import loginIcon3 from '../../assets/login-icon3.svg'

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

      const from = (location.state as { from?: Location })?.from?.pathname
      const level = res.data.user.role.access_level

      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else if (level <= 2) {
        navigate('/admin', { replace: true })
      } else if (level === 5) {
        navigate('/customer', { replace: true })
      } else if (level === 6) {
        navigate('/affiliate', { replace: true })
      } else if (level === 7) {
        navigate('/agent', { replace: true })
      } else if (level === 8) {
        navigate('/planner', { replace: true })
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT — login form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-white px-6 py-10 sm:px-10 lg:pl-20 lg:pr-12 lg:py-14 flex flex-col lg:rounded-r-[40px] relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 self-start">
          <img src={logoImg}  alt="" className="h-12 w-12" />
          <img src={logoText} alt="One Day Event" className="h-8" />
        </Link>

        {/* Form */}
        <div className="w-full max-w-md mt-16 lg:mt-24">
          <h2 className="text-2xl lg:text-[26px] font-bold text-[#262D45] mb-12 tracking-tight">
            Login to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-7">
              <label className="block text-xs font-semibold uppercase text-[#262D45] mb-4 tracking-wider">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="Your Email"
                className={`w-full h-[60px] px-5 rounded-xl border text-sm text-[#262D45] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-[#DFDFDF] bg-white'}`}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-10">
              <label className="block text-xs font-semibold uppercase text-[#262D45] mb-4 tracking-wider">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Your Password"
                className={`w-full h-[60px] px-5 rounded-xl border text-sm text-[#262D45] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-[#DFDFDF] bg-white'}`}
              />
              {errors.password && (
                <p className="mt-2 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Next + Forgot Password */}
            <div className="flex items-center justify-between flex-wrap gap-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#E0232C] hover:bg-[#C41E26] disabled:opacity-60 text-white font-semibold rounded-full px-12 h-[60px] min-w-[160px] text-base transition shadow-sm"
              >
                {isSubmitting ? 'Signing in…' : 'Next'}
              </button>
              <Link
                to="/forgot-password"
                className="text-[#1CA0DF] hover:underline text-sm font-medium"
              >
                Forgot Password
              </Link>
            </div>
          </form>

          {/* Sign up */}
          <p className="mt-14 text-sm text-[#808080]">
            Don&apos;t have an account
            <Link to="/register" className="ml-5 text-[#262D45] font-bold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT — marketing panel ───────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-[#F8F8F8] text-[#262D45] px-6 py-10 sm:px-10 lg:px-12 lg:py-14 relative flex flex-col">
        {/* Contact button */}
        <div className="flex justify-end">
          <Link
            to="/contact"
            className="bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold rounded-full px-10 h-[52px] flex items-center transition"
          >
            Contact
          </Link>
        </div>

        {/* Heading + cards */}
        <div className="flex-1 flex items-start justify-center mt-10 lg:mt-20">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl lg:text-[32px] font-bold leading-tight mb-12">
              What our Customer Portal does?
            </h2>

            <div className="space-y-12">
              <Feature icon={loginIcon1} title="Edit your policy" />
              <Feature icon={loginIcon2} title="24/7 access to all your documents" />
              <Feature icon={loginIcon3} title="Send your Certificate instantly to anyone" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title }: { icon: string; title: string }) {
  return (
    <div>
      <div className="bg-white rounded-2xl w-[115px] h-[115px] mx-auto flex items-center justify-center mb-4 shadow-sm">
        <img src={icon} alt="" className="max-h-[60px] max-w-[60px]" />
      </div>
      <h3 className="text-xl font-bold leading-snug px-4">{title}</h3>
    </div>
  )
}
