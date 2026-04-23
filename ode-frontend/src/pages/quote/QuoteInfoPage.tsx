import { useEffect, useRef } from 'react'
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
  // Personal / contact
  first_name:  z.string().min(1, 'Required'),
  last_name:   z.string().min(1, 'Required'),
  email:       z.string().min(1, 'Required').email('Enter a valid email'),
  phone:       z.string().min(7, 'Enter a valid phone number'),

  // Insured address (who is on the policy)
  ins_first_name: z.string().min(1, 'Required'),
  ins_last_name:  z.string().min(1, 'Required'),
  ins_street:     z.string().min(1, 'Required'),
  ins_city:       z.string().min(1, 'Required'),
  ins_state:      z.string().min(1, 'Select a state'),
  ins_zip:        z.string().regex(/^\d{5}$/, 'Enter a 5-digit zip'),

  // Event / venue
  event_name:           z.string().min(1, 'Required'),
  venue_name:           z.string().min(1, 'Required'),
  venue_address:        z.string().min(1, 'Required'),
  venue_city:           z.string().min(1, 'Required'),
  venue_state:          z.string().min(1, 'Select a state'),
  venue_zip:            z.string().regex(/^\d{5}$/, 'Enter a 5-digit zip'),
  venue_contact_person: z.string().optional(),
  venue_contact_email:  z.string().email('Enter a valid email').or(z.literal('')).optional(),
  venue_contact_number: z.string().optional(),

  // Acknowledge
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
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
      {children}
    </h2>
  )
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] ${
    err ? 'border-red-400' : 'border-gray-300'
  }`

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuoteInfoPage() {
  const navigate       = useNavigate()
  const selectedPlan   = useQuoteStore((s) => s.selectedPlan)
  const params         = useQuoteStore((s) => s.params)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)
  const sigRef         = useRef<SignatureCanvas>(null)

  // Guard
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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      // Pre-fill state from quote params
      ins_state:   params.event_state ?? '',
      venue_state: params.event_state ?? '',
    },
  })

  // Same-as-contact checkbox pre-fill
  const fillInsuredFromContact = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) return
    const el = (name: string) =>
      (document.getElementsByName(name)[0] as HTMLInputElement)?.value ?? ''
    setValue('ins_first_name', el('first_name'))
    setValue('ins_last_name',  el('last_name'))
  }

  const onSubmit = (data: FormData) => {
    // Capture signature as base64 PNG
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
    <QuoteLayout step={4}>
      {/* Back + plan summary */}
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/quote/plans')}
          className="text-[#1CA0DF] hover:text-[#105778] text-sm font-medium"
        >
          ← Back
        </button>
        {selectedPlan && (
          <span className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-gray-700">
            {selectedPlan.min_limit}M / {selectedPlan.max_limit}M &nbsp;·&nbsp;
            <span className="font-semibold text-[#105778]">${total}</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="bg-white rounded-2xl shadow-md px-8 py-8 space-y-8">

          {/* ── 1. Contact Info ─────────────────────────────────────── */}
          <div>
            <SectionTitle>Your contact information</SectionTitle>
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
                <input {...register('email')} type="email" className={inputCls(errors.email?.message)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone" required error={errors.phone?.message}>
                <input {...register('phone')} type="tel" className={inputCls(errors.phone?.message)} placeholder="(555) 000-0000" />
              </Field>
            </div>
          </div>

          {/* ── 2. Named Insured ────────────────────────────────────── */}
          <div>
            <SectionTitle>Named insured (who is covered)</SectionTitle>
            <p className="text-xs text-gray-400 mb-4">
              This is the person or organization on the policy — usually the event host.
            </p>

            <label className="flex items-center gap-2 text-sm text-gray-600 mb-4 cursor-pointer">
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
              <Field label="Zip" required error={errors.ins_zip?.message}>
                <input {...register('ins_zip')} className={inputCls(errors.ins_zip?.message)} placeholder="90210" maxLength={5} />
              </Field>
            </div>
          </div>

          {/* ── 3. Event & Venue ────────────────────────────────────── */}
          <div>
            <SectionTitle>Event & venue details</SectionTitle>

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

            <div className="grid grid-cols-3 gap-4 mb-4">
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
              <Field label="Zip" required error={errors.venue_zip?.message}>
                <input {...register('venue_zip')} className={inputCls(errors.venue_zip?.message)} placeholder="90210" maxLength={5} />
              </Field>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Venue contact details are optional — if provided, we'll send the certificate directly to them.
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

          {/* ── 4. Signature ────────────────────────────────────────── */}
          <div>
            <SectionTitle>Signature</SectionTitle>
            <p className="text-xs text-gray-400 mb-3">
              By signing below you confirm the information is accurate and agree to the policy terms.
            </p>
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
              <SignatureCanvas
                ref={sigRef}
                penColor="#1e3a8a"
                canvasProps={{
                  className: 'w-full',
                  style: { height: 140, width: '100%' },
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => sigRef.current?.clear()}
              className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear signature
            </button>
          </div>

          {/* ── 5. Acknowledge ──────────────────────────────────────── */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('acknowledge')}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                I acknowledge that the event details provided are accurate, that I have read and
                agree to the{' '}
                <a href="/terms" target="_blank" className="text-[#1CA0DF] underline">
                  Terms &amp; Conditions
                </a>
                , and that I am authorized to purchase this policy.
              </span>
            </label>
            <FieldError msg={errors.acknowledge?.message} />
          </div>

          {/* ── Submit ──────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40"
          >
            Continue to Payment →
          </button>

        </div>
      </form>
    </QuoteLayout>
  )
}
