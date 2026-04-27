import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import SignatureCanvas from 'react-signature-canvas'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { UsState } from '../../types'
import QuoteLayout from './QuoteLayout'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  first_name:  z.string().min(1, 'Required'),
  last_name:   z.string().min(1, 'Required'),
  email:       z.string().min(1, 'Required').email('Enter a valid email'),
  phone:       z.string().min(7, 'Enter a valid phone number'),

  ins_first_name: z.string().min(1, 'Required'),
  ins_last_name:  z.string().min(1, 'Required'),
  ins_street:     z.string().min(1, 'Required'),
  ins_city:       z.string().min(1, 'Required'),
  ins_state:      z.string().min(1, 'Select a state'),
  ins_zip:        z.string().regex(/^\d{5}$/, 'Enter a 5-digit zip'),

  event_name:           z.string().min(1, 'Required'),
  venue_name:           z.string().min(1, 'Required'),
  venue_address:        z.string().min(1, 'Required'),
  venue_city:           z.string().min(1, 'Required'),
  venue_state:          z.string().min(1, 'Select a state'),
  venue_zip:            z.string().regex(/^\d{5}$/, 'Enter a 5-digit zip'),
  venue_contact_person: z.string().optional(),
  venue_contact_email:  z.string().email('Enter a valid email').or(z.literal('')).optional(),
  venue_contact_number: z.string().optional(),

  acknowledge: z.literal(true, { error: 'You must accept the terms' }),
})

type FormData = z.infer<typeof schema>

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchStates(): Promise<UsState[]> {
  const res = await api.get<UsState[]>('/us-states')
  return res.data
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-[#E0232C] flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
        {label}{required && <span className="text-[#E0232C] ml-0.5">*</span>}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteInfoPage() {
  const navigate          = useNavigate()
  const selectedPlan      = useQuoteStore((s) => s.selectedPlan)
  const params            = useQuoteStore((s) => s.params)
  const plans             = useQuoteStore((s) => s.plans)
  const pendingQuoteId    = useQuoteStore((s) => s.pendingQuoteId)
  const setPendingQuoteId = useQuoteStore((s) => s.setPendingQuoteId)
  const setCustomerInfo   = useQuoteStore((s) => s.setCustomerInfo)
  const sigRef            = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  const { data: states = [] } = useQuery({
    queryKey: ['us-states'],
    queryFn:  fetchStates,
    staleTime: 10 * 60 * 1000,
  })

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ins_state:   params.event_state ?? '',
      venue_state: params.event_state ?? '',
    },
  })

  const autoSave = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    try {
      const currentState = { params, plans, selectedPlan, customerInfo: getValues() }
      const payload: Record<string, unknown> = {
        email,
        current_route: '/quote/info',
        wizard_state:  currentState,
      }
      if (pendingQuoteId) payload.pending_quote_id = pendingQuoteId
      const { data } = await api.post<{ pending_quote_id: string; created: boolean }>(
        '/leads/pending',
        payload
      )
      if (data.pending_quote_id) setPendingQuoteId(data.pending_quote_id)
    } catch {
      // best-effort
    }
  }, [params, plans, selectedPlan, pendingQuoteId, setPendingQuoteId, getValues])

  const fillInsuredFromContact = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) return
    const el = (name: string) =>
      (document.getElementsByName(name)[0] as HTMLInputElement)?.value ?? ''
    setValue('ins_first_name', el('first_name'))
    setValue('ins_last_name',  el('last_name'))
  }

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
    <QuoteLayout step={9}>

      {/* ── Back + plan summary pill ─────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/quote/plans')}
          className="inline-flex items-center gap-1 text-sm text-[#1CA0DF] hover:text-[#105778] font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Plans
        </button>

        {selectedPlan && (
          <div className="flex items-center gap-2 bg-white border border-[#E3E3E3] rounded-xl px-4 py-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#1CA0DF]" />
            <span className="text-sm text-[#505458]">
              ${selectedPlan.min_limit}M / ${selectedPlan.max_limit}M
            </span>
            <span className="text-[#E3E3E3]">·</span>
            <span className="text-sm font-bold text-[#105778]">${total}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

        {/* ── 1. Contact Info ─────────────────────────────────────────── */}
        <SectionCard num={1} title="Your contact information">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="First name" required error={errors.first_name?.message}>
              <input {...register('first_name')} className={inputCls(errors.first_name?.message)} placeholder="Jane" />
            </Field>
            <Field label="Last name" required error={errors.last_name?.message}>
              <input {...register('last_name')} className={inputCls(errors.last_name?.message)} placeholder="Smith" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <input {...register('phone')} type="tel" className={inputCls(errors.phone?.message)} placeholder="(408) 000-0000" />
            </Field>
          </div>
        </SectionCard>

        {/* ── 2. Named Insured ────────────────────────────────────────── */}
        <SectionCard
          num={2}
          title="Named insured"
          subtitle="The person or organization on the policy — usually the event host."
        >
          <label className="flex items-center gap-2.5 text-sm text-[#505458] mb-5 cursor-pointer p-3 bg-[#EDF0FA]/60 rounded-xl border border-[#E3E3E3]">
            <input
              type="checkbox"
              onChange={fillInsuredFromContact}
              className="h-4 w-4 rounded border-gray-300 text-[#1CA0DF]"
            />
            Same as contact information above
          </label>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="First name" required error={errors.ins_first_name?.message}>
              <input {...register('ins_first_name')} className={inputCls(errors.ins_first_name?.message)} placeholder="Jane" />
            </Field>
            <Field label="Last name" required error={errors.ins_last_name?.message}>
              <input {...register('ins_last_name')} className={inputCls(errors.ins_last_name?.message)} placeholder="Smith" />
            </Field>
          </div>
          <div className="mb-4">
            <Field label="Street address" required error={errors.ins_street?.message}>
              <input {...register('ins_street')} className={inputCls(errors.ins_street?.message)} placeholder="123 Main St" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City" required error={errors.ins_city?.message}>
              <input {...register('ins_city')} className={inputCls(errors.ins_city?.message)} placeholder="Los Angeles" />
            </Field>
            <Field label="State" required error={errors.ins_state?.message}>
              <select {...register('ins_state')} className={inputCls(errors.ins_state?.message)}>
                <option value="">State…</option>
                {states.map((s) => (
                  <option key={s.id} value={s.abbreviation}>{s.abbreviation}</option>
                ))}
              </select>
            </Field>
            <Field label="ZIP" required error={errors.ins_zip?.message}>
              <input {...register('ins_zip')} className={inputCls(errors.ins_zip?.message)} placeholder="90210" maxLength={5} />
            </Field>
          </div>
        </SectionCard>

        {/* ── 3. Event & Venue ────────────────────────────────────────── */}
        <SectionCard num={3} title="Event & venue details">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Event name" required error={errors.event_name?.message}>
              <input {...register('event_name')} className={inputCls(errors.event_name?.message)} placeholder="Jane's Birthday Party" />
            </Field>
            <Field label="Venue name" required error={errors.venue_name?.message}>
              <input {...register('venue_name')} className={inputCls(errors.venue_name?.message)} placeholder="The Grand Ballroom" />
            </Field>
          </div>

          <div className="mb-4">
            <Field label="Venue street address" required error={errors.venue_address?.message}>
              <input {...register('venue_address')} className={inputCls(errors.venue_address?.message)} placeholder="456 Venue Ave" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <Field label="City" required error={errors.venue_city?.message}>
              <input {...register('venue_city')} className={inputCls(errors.venue_city?.message)} placeholder="Los Angeles" />
            </Field>
            <Field label="State" required error={errors.venue_state?.message}>
              <select {...register('venue_state')} className={inputCls(errors.venue_state?.message)}>
                <option value="">State…</option>
                {states.map((s) => (
                  <option key={s.id} value={s.abbreviation}>{s.abbreviation}</option>
                ))}
              </select>
            </Field>
            <Field label="ZIP" required error={errors.venue_zip?.message}>
              <input {...register('venue_zip')} className={inputCls(errors.venue_zip?.message)} placeholder="90210" maxLength={5} />
            </Field>
          </div>

          <div className="pt-4 border-t border-[#E3E3E3]">
            <p className="text-xs font-semibold text-[#262D45] mb-3">
              Venue contact{' '}
              <span className="text-[#797979] font-normal">(optional — if provided, we'll send the COI directly to them)</span>
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contact name" error={errors.venue_contact_person?.message}>
                <input {...register('venue_contact_person')} className={inputCls()} placeholder="Optional" />
              </Field>
              <Field label="Contact phone" error={errors.venue_contact_number?.message}>
                <input {...register('venue_contact_number')} type="tel" className={inputCls()} placeholder="Optional" />
              </Field>
              <Field label="Contact email" error={errors.venue_contact_email?.message}>
                <input {...register('venue_contact_email')} type="email" className={inputCls(errors.venue_contact_email?.message)} placeholder="Optional" />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ── 4. Signature ────────────────────────────────────────────── */}
        <SectionCard
          num={4}
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

        {/* ── 5. Acknowledgement ──────────────────────────────────────── */}
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

        {/* ── Submit ──────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-[#E0232C] hover:bg-[#C51E26] text-white font-bold text-base tracking-wide transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Continue to Payment →'}
        </button>

      </form>
    </QuoteLayout>
  )
}
