import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { useAuthStore } from '../../stores/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type PartnerType = 'agent' | 'planner'

interface RegisterResponse {
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string | null
    status: number
    referral_string: string
    w9_status: boolean
    is_agency: boolean
    role: { id: number; role_name: string; access_level: number }
  }
  token: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name:  z.string().min(1, 'Required'),
  email:      z.string().min(1, 'Required').email('Enter a valid email'),
  phone:      z.string().min(7, 'Enter a valid phone number'),
})

const step2Schema = z.object({
  company_name:    z.string().optional(),
  website:         z.string().url('Include https://').or(z.literal('')).optional(),
  license_number:  z.string().optional(),   // shown for agent only
  venue_capacity:  z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().int().min(1).optional()),  // shown for planner only
  how_did_you_hear: z.string().optional(),
})

const step3Schema = z.object({
  password:              z.string().min(8, 'At least 8 characters'),
  password_confirmation: z.string().min(1, 'Required'),
  agree_to_terms:        z.literal(true, { error: 'You must agree to continue' }),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] ${err ? 'border-red-400' : 'border-gray-300'}`

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepsIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Your info', 'Details', 'Password']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done   ? 'bg-[#1CA0DF] text-white' :
                active ? 'bg-[#1CA0DF] text-white ring-4 ring-[#EDF0FA]' :
                         'bg-gray-100 text-gray-400'
              }`}>
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${active ? 'text-[#1CA0DF] font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-4 ${done ? 'bg-[#1CA0DF]' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Type selector card ───────────────────────────────────────────────────────

function TypeCard({
  selected,
  value,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean
  value: PartnerType
  title: string
  description: string
  icon: React.ReactNode
  onClick: (v: PartnerType) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex-1 text-left rounded-xl border-2 px-4 py-4 transition-all ${
        selected
          ? 'border-[#1CA0DF] bg-[#EDF0FA]'
          : 'border-gray-200 bg-white hover:border-[#1CA0DF]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#1CA0DF] text-white' : 'bg-gray-100 text-gray-400'}`}>
          {icon}
        </div>
        <div>
          <p className={`text-sm font-semibold ${selected ? 'text-[#105778]' : 'text-gray-700'}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerSignupPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth       = useAuthStore((s) => s.setAuth)

  const defaultType = (searchParams.get('type') as PartnerType | null) ?? 'agent'

  const [partnerType, setPartnerType] = useState<PartnerType>(defaultType)
  const [step,        setStep]        = useState<1 | 2 | 3>(1)
  const [step1,       setStep1]       = useState<Step1Data | null>(null)
  const [step2,       setStep2]       = useState<Step2Data | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [apiError,    setApiError]    = useState<string | null>(null)

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1 ?? { first_name: '', last_name: '', email: '', phone: '' },
  })

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema) as Resolver<Step2Data>,
    defaultValues: step2 ?? { company_name: '', website: '', license_number: '', venue_capacity: undefined, how_did_you_hear: '' },
  })

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { password: '', password_confirmation: '', agree_to_terms: undefined },
  })

  const onStep1 = (data: Step1Data) => {
    setStep1(data)
    setStep(2)
  }

  const onStep2 = (data: Step2Data) => {
    setStep2(data)
    setStep(3)
  }

  const onStep3 = async (data: Step3Data) => {
    if (!step1) return
    setApiError(null)
    setSubmitting(true)

    try {
      const payload = {
        type:                  partnerType,
        ...step1,
        company_name:          step2?.company_name  || undefined,
        website:               step2?.website       || undefined,
        license_number:        step2?.license_number || undefined,
        venue_capacity:        step2?.venue_capacity || undefined,
        how_did_you_hear:      step2?.how_did_you_hear || undefined,
        password:              data.password,
        password_confirmation: data.password_confirmation,
        agree_to_terms:        true,
      }

      const res = await api.post<RegisterResponse>('/partner/register', payload)
      const { user, token } = res.data

      setAuth(
        {
          id:              user.id,
          first_name:      user.first_name,
          last_name:       user.last_name,
          email:           user.email,
          phone:           user.phone,
          status:          user.status,
          is_agency:       user.is_agency,
          referral_string: user.referral_string,
          w9_status:       user.w9_status,
          role: {
            id:           user.role.id,
            role_name:    user.role.role_name,
            access_level: user.role.access_level,
          },
        },
        token,
      )

      const label = partnerType === 'agent' ? 'Agent' : 'Planner/Venue'
      toast.success(`Welcome! Your ${label} account is ready.`)
      navigate('/', { replace: true })

    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }

      if (error.response?.status === 422) {
        const apiErrors = error.response.data?.errors ?? {}
        if (apiErrors.email) {
          form1.setError('email', { message: apiErrors.email[0] })
          setStep(1)
        } else {
          setApiError(Object.values(apiErrors).flat()[0] ?? 'Validation error.')
        }
      } else {
        setApiError(error.response?.data?.message ?? 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isAgent   = partnerType === 'agent'
  const isPlanner = partnerType === 'planner'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold text-[#105778]">
              One Day <span className="text-gray-700">Event</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-800">Partner Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join our network to offer event insurance to your clients.
          </p>
        </div>

        {/* Type selector — always visible */}
        <div className="flex gap-3 mb-6">
          <TypeCard
            value="agent"
            selected={isAgent}
            onClick={setPartnerType}
            title="Agent / Partner"
            description="Insurance agents or event industry professionals who refer clients."
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
              </svg>
            }
          />
          <TypeCard
            value="planner"
            selected={isPlanner}
            onClick={setPartnerType}
            title="Venue / Planner"
            description="Event planners and venue coordinators who connect clients with coverage."
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            }
          />
        </div>

        <StepsIndicator current={step} />

        <div className="bg-white rounded-2xl shadow-md px-8 py-8">

          {/* ── Step 1: Personal info ──────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1)} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First name *</label>
                  <input {...form1.register('first_name')} className={inputCls(form1.formState.errors.first_name?.message)} placeholder="Jane" />
                  <FieldError msg={form1.formState.errors.first_name?.message} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last name *</label>
                  <input {...form1.register('last_name')} className={inputCls(form1.formState.errors.last_name?.message)} placeholder="Smith" />
                  <FieldError msg={form1.formState.errors.last_name?.message} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email address *</label>
                <input {...form1.register('email')} type="email" className={inputCls(form1.formState.errors.email?.message)} placeholder="jane@example.com" />
                <FieldError msg={form1.formState.errors.email?.message} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone number *</label>
                <input {...form1.register('phone')} type="tel" className={inputCls(form1.formState.errors.phone?.message)} placeholder="(555) 000-0000" />
                <FieldError msg={form1.formState.errors.phone?.message} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm rounded-lg transition-colors mt-2">
                Continue →
              </button>
            </form>
          )}

          {/* ── Step 2: Business details ───────────────────────────── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2)} noValidate className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {isAgent ? 'Company / agency name' : 'Venue / company name'}
                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                </label>
                <input {...form2.register('company_name')} className={inputCls()} placeholder={isAgent ? 'ABC Insurance Agency' : 'The Grand Ballroom'} />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Website <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input {...form2.register('website')} type="url" className={inputCls(form2.formState.errors.website?.message)} placeholder="https://yoursite.com" />
                <FieldError msg={form2.formState.errors.website?.message} />
              </div>

              {/* Agent-specific field */}
              {isAgent && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Insurance license number <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input {...form2.register('license_number')} className={inputCls()} placeholder="e.g. 0A12345" />
                </div>
              )}

              {/* Planner-specific field */}
              {isPlanner && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Typical event / venue capacity <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input {...form2.register('venue_capacity')} type="number" min={1} className={inputCls(form2.formState.errors.venue_capacity?.message)} placeholder="e.g. 250" />
                  <FieldError msg={form2.formState.errors.venue_capacity?.message} />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  How did you hear about us? <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <select {...form2.register('how_did_you_hear')} className={inputCls()}>
                  <option value="">Select one…</option>
                  <option value="google">Google search</option>
                  <option value="social_media">Social media</option>
                  <option value="referral">Referred by someone</option>
                  <option value="conference">Conference / event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium text-sm rounded-lg transition-colors">
                  ← Back
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm rounded-lg transition-colors">
                  Continue →
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Password + terms ───────────────────────────── */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(onStep3)} noValidate className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password *</label>
                <input {...form3.register('password')} type="password" autoComplete="new-password" className={inputCls(form3.formState.errors.password?.message)} placeholder="At least 8 characters" />
                <FieldError msg={form3.formState.errors.password?.message} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confirm password *</label>
                <input {...form3.register('password_confirmation')} type="password" autoComplete="new-password" className={inputCls(form3.formState.errors.password_confirmation?.message)} placeholder="Repeat your password" />
                <FieldError msg={form3.formState.errors.password_confirmation?.message} />
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  {...form3.register('agree_to_terms')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-[#1CA0DF] underline">Terms &amp; Conditions</a>
                  {' '}and the{' '}
                  <a href="/partner-agreement" target="_blank" className="text-[#1CA0DF] underline">Partner Agreement</a>.
                </span>
              </label>
              <FieldError msg={form3.formState.errors.agree_to_terms?.message} />

              {apiError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {apiError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(2)}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium text-sm rounded-lg transition-colors">
                  ← Back
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-40">
                  {submitting ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1CA0DF] hover:underline font-medium">Sign in</Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Looking to become an affiliate?{' '}
          <Link to="/affiliate-signup" className="text-[#1CA0DF] hover:underline font-medium">Sign up here</Link>
        </p>

      </div>
    </div>
  )
}
