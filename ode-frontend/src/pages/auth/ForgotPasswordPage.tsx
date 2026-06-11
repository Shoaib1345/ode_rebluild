import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/forgot-password', data)
      setSentTo(data.email)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  // ── Sent confirmation ────────────────────────────────────────────────────────
  if (sentTo) {
    return (
      <SplitAuthLayout
        title="Check your email"
        subtitle="A password reset link is on its way."
        panelTitle="What our Customer Portal does?"
        features={PANEL_FEATURES}
        footer={
          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">← Back to login</Link>
          </p>
        }
      >
        <div className="rounded-xl border border-green-100 bg-green-50/60 px-6 py-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            If an account exists for <strong>{sentTo}</strong>, we&apos;ve sent a link to reset your password.
            The link expires in 60 minutes. Don&apos;t forget to check your spam folder.
          </p>
        </div>
      </SplitAuthLayout>
    )
  }

  // ── Request form ─────────────────────────────────────────────────────────────
  return (
    <SplitAuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      panelTitle="What our Customer Portal does?"
      features={PANEL_FEATURES}
      footer={
        <p className="text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-[#262D45] mb-2 tracking-wider">
            Email Address
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="Your Email"
            className={`w-full h-[56px] px-5 rounded-xl border text-sm text-[#262D45] placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] transition
              ${errors.email ? 'border-red-400 bg-red-50' : 'border-[#DFDFDF] bg-white'}`}
          />
          {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#E0232C] hover:bg-[#C41E26] disabled:opacity-60 text-white font-semibold rounded-full px-12 h-[56px] min-w-[180px] text-base transition shadow-sm"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </SplitAuthLayout>
  )
}
