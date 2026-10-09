import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SignatureCanvas from 'react-signature-canvas'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteLayout from './QuoteLayout'
import { Footer } from '../../components/layout/PublicLayout'

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  acknowledge: z.literal(true, { error: 'You must accept the terms' }),
})

type FormData = z.infer<typeof schema>

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-[#E0232C] flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {msg}
    </p>
  )
}

function SectionCard({
  num,
  title,
  subtitle,
  children,
}: {
  num: number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(55,106,136,0.08)] overflow-hidden">
      <div className="flex items-start gap-3 px-6 py-4 bg-[#EDF0FA] border-b border-[#E3E3E3]/70">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1CA0DF] text-white text-xs font-bold flex items-center justify-center mt-0.5">
          {num}
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-[#262D45]">{title}</h2>
          {subtitle && <p className="text-xs text-[#797979] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#262D45] mb-1.5">
        {label}
        {required && <span className="text-[#E0232C] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#797979]">{hint}</p>}
      <FieldError msg={error} />
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm text-[#262D45] placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
    err
      ? 'border-[#E0232C] bg-red-50 focus:ring-red-200 focus:border-[#E0232C]'
      : 'border-[#E3E3E3] bg-white focus:ring-[#1CA0DF]/20 focus:border-[#1CA0DF]'
  }`

export default function QuoteInfoPage() {
  const navigate = useNavigate()
  const selectedPlan = useQuoteStore((s) => s.selectedPlan)
  const params = useQuoteStore((s) => s.params)
  const plans = useQuoteStore((s) => s.plans)
  const pendingQuoteId = useQuoteStore((s) => s.pendingQuoteId)
  const setPendingQuoteId = useQuoteStore((s) => s.setPendingQuoteId)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)
  const customerInfo = useQuoteStore((s) => s.customerInfo)
  const sigRef = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: String(customerInfo.first_name ?? ''),
      last_name: String(customerInfo.last_name ?? ''),
      email: String(customerInfo.email ?? ''),
      phone: String(customerInfo.phone ?? ''),
    },
  })

  const autoSave = useCallback(
    async (email: string) => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
      try {
        const { default: api } = await import('../../lib/axios')
        const currentState = {
          params,
          plans,
          selectedPlan,
          customerInfo: { ...customerInfo, ...getValues() },
        }
        const payload: Record<string, unknown> = {
          email,
          current_route: '/quote/info',
          wizard_state: currentState,
        }
        if (pendingQuoteId) payload.pending_quote_id = pendingQuoteId
        const { data } = await api.post<{ pending_quote_id: string; created: boolean }>(
          '/leads/pending',
          payload,
        )
        if (data.pending_quote_id) setPendingQuoteId(data.pending_quote_id)
      } catch {
        // best-effort
      }
    },
    [params, plans, selectedPlan, customerInfo, pendingQuoteId, setPendingQuoteId, getValues],
  )

  const onSubmit = (data: FormData) => {
    const sigData = sigRef.current && !sigRef.current.isEmpty()
      ? sigRef.current.toDataURL('image/png')
      : ''
    setCustomerInfo({ ...data, signature: sigData })
    navigate('/quote/payment')
  }

  const total = selectedPlan
    ? (selectedPlan.total + (selectedPlan.extra_charge ?? 0)).toFixed(2)
    : '0.00'

  return (
    <QuoteLayout step={9} wide>
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#E3E3E3] bg-[#F8F8F8] shadow-sm">
        <img
          src="/assets/images/hero-bg2.webp"
          alt="One Day Event Insurance"
          className="block w-full h-auto"
        />
      </div>

      <div className="mb-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={() => navigate('/quote/venue')}
          className="inline-flex items-center gap-1 text-sm text-[#1CA0DF] hover:text-[#105778] font-medium transition self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Venue
        </button>

        {selectedPlan && (
          <div className="flex flex-wrap items-center gap-2 bg-white border border-[#E3E3E3] rounded-xl px-4 py-2 shadow-sm w-full md:w-auto">
            <div className="w-2 h-2 rounded-full bg-[#1CA0DF]" />
            <span className="text-sm text-[#505458]">
              ${selectedPlan.min_limit}M / ${selectedPlan.max_limit}M
            </span>
            <span className="text-[#E3E3E3]">|</span>
            <span className="text-sm font-bold text-[#105778]">${total}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <SectionCard num={1} title="Your contact information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="First name" required error={errors.first_name?.message}>
              <input
                {...register('first_name')}
                className={inputCls(errors.first_name?.message)}
                placeholder="Jane"
              />
            </Field>
            <Field label="Last name" required error={errors.last_name?.message}>
              <input
                {...register('last_name')}
                className={inputCls(errors.last_name?.message)}
                placeholder="Smith"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" required error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                className={inputCls(errors.email?.message)}
                placeholder="jane@example.com"
                onBlur={(e) => autoSave(e.target.value)}
              />
            </Field>
            <Field label="Phone" required error={errors.phone?.message}>
              <input
                {...register('phone')}
                type="tel"
                className={inputCls(errors.phone?.message)}
                placeholder="(408) 000-0000"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          num={2}
          title="Signature"
          subtitle="By signing you confirm the information is accurate and agree to the policy terms."
        >
          <div className="rounded-xl border-2 border-dashed border-[#E3E3E3] bg-[#FAFAFA] overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              penColor="#105778"
              canvasProps={{
                className: 'w-full',
                style: { height: 140, width: '100%' },
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="mt-1.5 text-xs text-[#797979] hover:text-[#E0232C] transition-colors"
          >
            Clear signature
          </button>
        </SectionCard>

        <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(55,106,136,0.08)] px-6 py-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('acknowledge')}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF] flex-shrink-0"
            />
            <span className="text-sm text-[#505458] leading-relaxed">
              I acknowledge that the event details provided are accurate, that I have read and agree to the{' '}
              <a href="/terms" target="_blank" className="text-[#1CA0DF] underline font-medium">
                Terms &amp; Conditions
              </a>
              , and that I am authorized to purchase this policy.
            </span>
          </label>
          <FieldError msg={errors.acknowledge?.message} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-[#E0232C] hover:bg-[#C51E26] text-white font-bold text-base tracking-wide transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Continue to Payment ->'}
        </button>
      </form>

      <div className="mt-10">
        <Footer />
      </div>
    </QuoteLayout>
  )
}
