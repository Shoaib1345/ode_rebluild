import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import SplitAuthLayout, { type AuthFeature } from './SplitAuthLayout'

const PANEL_FEATURES: AuthFeature[] = [
  { icon: '/assets/images/login-icon1.svg', title: 'Edit your policy' },
  { icon: '/assets/images/login-icon2.svg', title: '24/7 access to all your documents' },
  { icon: '/assets/images/login-icon3.svg', title: 'Send your Certificate instantly to anyone' },
]

const schema = z.object({
  password:              z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})
type FormData = z.infer<typeof schema>

// ── Password input with eye toggle ──────────────────────────────────────────────

function PasswordInput({
  label, register, error, autoComplete,
}: {
  label: string
  register: ReturnType<ReturnType<typeof useForm<FormData>>['register']>
  error?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-semibold uppercase text-[#262D45] mb-2 tracking-wider">{label}</label>
      <div className="relative">
        <input
          {...register}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className={`w-full h-[56px] pl-5 pr-14 rounded-xl border text-sm text-[#262D45] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
            ${error ? 'border-red-400 bg-red-50' : 'border-[#DFDFDF] bg-white'}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 px-4 flex items-center text-[#808080] hover:text-[#262D45] transition-colors"
        >
          {show ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const email = params.get('email')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token || !email) return
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password:              data.password,
        password_confirmation: data.password_confirmation,
      })
      toast.success('Password reset! Please sign in.')
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }
      if (e.response?.status === 422) {
        const apiErr = e.response.data?.errors ?? {}
        if (apiErr.password) setError('password', { message: apiErr.password[0] })
        else toast.error(e.response.data?.message ?? 'This reset link is invalid or has expired.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  // ── Invalid link ─────────────────────────────────────────────────────────────
  if (!token || !email) {
    return (
      <SplitAuthLayout
        title="Invalid reset link"
        subtitle="This link is missing information or has expired."
        panelTitle="What our Customer Portal does?"
        features={PANEL_FEATURES}
        footer={
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">← Back to login</Link>
          </p>
        }
      >
        <div className="rounded-xl border border-red-100 bg-red-50/60 px-6 py-8 text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            Please request a new password reset link.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block rounded-lg bg-[#1CA0DF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1786BB] transition-colors"
          >
            Request a new link
          </Link>
        </div>
      </SplitAuthLayout>
    )
  }

  // ── Reset form ───────────────────────────────────────────────────────────────
  return (
    <SplitAuthLayout
      title="Set a new password"
      subtitle={`For ${email}`}
      panelTitle="What our Customer Portal does?"
      features={PANEL_FEATURES}
      footer={
        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">← Back to login</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <PasswordInput label="New Password"     register={register('password')}              error={errors.password?.message}              autoComplete="new-password" />
        <PasswordInput label="Confirm Password" register={register('password_confirmation')} error={errors.password_confirmation?.message} autoComplete="new-password" />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#E0232C] hover:bg-[#C41E26] disabled:opacity-60 text-white font-semibold rounded-full px-12 h-[56px] min-w-[180px] text-base transition shadow-sm"
        >
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </SplitAuthLayout>
  )
}
