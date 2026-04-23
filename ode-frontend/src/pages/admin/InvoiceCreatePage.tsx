import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Schema ───────────────────────────────────────────────────────────────────

const toNum = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v))

const lineItemSchema = z.object({
  fee_type:  z.string().min(1, 'Required'),
  amount:    z.preprocess(toNum, z.number().min(0, 'Must be ≥ 0')),
  quantity:  z.preprocess(toNum, z.number().int().min(1)),
  policy:    z.string().optional(),
})

const coverageLineSchema = z.object({
  benefit_type:  z.string().min(1, 'Required'),
  benefit_value: z.string().min(1, 'Required'),
})

const schema = z.object({
  lead_id:         z.preprocess(toNum, z.number().int().positive().optional()),
  type:            z.enum(['single', 'multi_plan']),
  // Recipient
  first_name:      z.string().min(1, 'Required'),
  last_name:       z.string().min(1, 'Required'),
  email:           z.string().min(1, 'Required').email('Invalid email'),
  email_cc:        z.string().email('Invalid email').or(z.literal('')).optional(),
  email_bcc:       z.string().email('Invalid email').or(z.literal('')).optional(),
  email_subject:   z.string().optional(),
  // Coverage
  event_type:      z.string().optional(),
  carrier:         z.string().optional(),
  effective_date:  z.string().optional(),
  expiration_date: z.string().optional(),
  min_limit:       z.preprocess(toNum, z.number().int().min(0).optional()),
  max_limit:       z.preprocess(toNum, z.number().int().min(0).optional()),
  // Pricing
  broker_fee:      z.preprocess(toNum, z.number().min(0).optional()),
  processing_fee:  z.preprocess(toNum, z.number().min(0).optional()),
  total_premium:   z.preprocess(toNum, z.number().min(0).optional()),
  total_payable:   z.preprocess(toNum, z.number().min(0, 'Required')),
  // Address
  street: z.string().optional(),
  suite:  z.string().optional(),
  city:   z.string().optional(),
  state:  z.string().max(2).optional().or(z.literal('')),
  zip:    z.string().max(10).optional(),
  // Nested
  line_items:     z.array(lineItemSchema),
  coverage_lines: z.array(coverageLineSchema),
})

type FormData = z.infer<typeof schema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
      {children}
    </h2>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] ${err ? 'border-red-400' : 'border-gray-300'}`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceCreatePage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillLeadId = searchParams.get('lead_id') ?? ''

  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      lead_id:        prefillLeadId ? Number(prefillLeadId) : undefined,
      type:           'single',
      line_items:     [{ fee_type: 'Premium', amount: 0, quantity: 1, policy: '' }],
      coverage_lines: [
        { benefit_type: 'Per Occurrence', benefit_value: '' },
        { benefit_type: 'General Aggregate', benefit_value: '' },
      ],
    },
  })

  const { fields: lineFields, append: appendLine, remove: removeLine } = useFieldArray({
    control,
    name: 'line_items',
  })

  const { fields: covFields, append: appendCov, remove: removeCov } = useFieldArray({
    control,
    name: 'coverage_lines',
  })

  const brokerFee     = Number(watch('broker_fee')     || 0)
  const processingFee = Number(watch('processing_fee') || 0)
  const totalPremium  = Number(watch('total_premium')  || 0)

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/admin/invoices', data).then((r) => r.data as { id: number }),
    onSuccess: (inv) => navigate(`/admin/invoices/${inv.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSubmitError(msg ?? 'Failed to create invoice. Please try again.')
    },
  })

  const onSubmit = (data: FormData) => {
    setSubmitError(null)
    mutation.mutate(data)
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <button onClick={() => navigate('/admin/invoices')}
            className="text-xs text-[#1CA0DF] hover:text-[#105778] mb-1 block">
            ← Back to invoices
          </button>
          <h1 className="text-xl font-bold text-gray-800">New Invoice</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5">

            {/* ── Meta ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Invoice settings</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lead ID <span className="text-gray-300">(optional)</span></label>
                  <input {...register('lead_id')} type="number" className={inputCls()} placeholder="e.g. 42" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select {...register('type')} className={inputCls()}>
                    <option value="single">Single plan</option>
                    <option value="multi_plan">Multi-plan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Recipient ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Recipient</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">First name *</label>
                  <input {...register('first_name')} className={inputCls(errors.first_name?.message)} />
                  <FieldError msg={errors.first_name?.message} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last name *</label>
                  <input {...register('last_name')} className={inputCls(errors.last_name?.message)} />
                  <FieldError msg={errors.last_name?.message} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input {...register('email')} type="email" className={inputCls(errors.email?.message)} />
                <FieldError msg={errors.email?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CC</label>
                  <input {...register('email_cc')} type="email" className={inputCls(errors.email_cc?.message)} placeholder="Optional" />
                  <FieldError msg={errors.email_cc?.message} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">BCC</label>
                  <input {...register('email_bcc')} type="email" className={inputCls(errors.email_bcc?.message)} placeholder="Optional" />
                  <FieldError msg={errors.email_bcc?.message} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email subject</label>
                <input {...register('email_subject')} className={inputCls()} placeholder="Your One Day Event Insurance Invoice" />
              </div>
            </div>

            {/* ── Coverage ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Coverage details</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Event type</label>
                  <input {...register('event_type')} className={inputCls()} placeholder="e.g. Wedding" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                  <input {...register('carrier')} className={inputCls()} placeholder="e.g. Markel" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Effective date</label>
                  <input {...register('effective_date')} type="date" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expiration date</label>
                  <input {...register('expiration_date')} type="date" className={inputCls()} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min limit (M)</label>
                  <input {...register('min_limit')} type="number" className={inputCls()} placeholder="1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max limit (M)</label>
                  <input {...register('max_limit')} type="number" className={inputCls()} placeholder="2" />
                </div>
              </div>
            </div>

            {/* ── Pricing ──────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Pricing</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total premium ($)</label>
                  <input {...register('total_premium')} type="number" step="0.01" className={inputCls()} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Broker fee ($)</label>
                  <input {...register('broker_fee')} type="number" step="0.01" className={inputCls()} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Processing fee ($)</label>
                  <input {...register('processing_fee')} type="number" step="0.01" className={inputCls()} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total payable ($) *</label>
                  <input {...register('total_payable')} type="number" step="0.01" className={inputCls(errors.total_payable?.message)} placeholder="0.00" />
                  <FieldError msg={errors.total_payable?.message} />
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Auto-sum: ${(totalPremium + brokerFee + processingFee).toFixed(2)} (premium + broker + processing)
              </div>
            </div>

            {/* ── Address ──────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Insured address</SectionTitle>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Street</label>
                  <input {...register('street')} className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Suite</label>
                  <input {...register('suite')} className={inputCls()} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City</label>
                  <input {...register('city')} className={inputCls()} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <input {...register('state')} maxLength={2} className={inputCls()} placeholder="CA" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Zip</label>
                  <input {...register('zip')} className={inputCls()} placeholder="90210" />
                </div>
              </div>
            </div>

            {/* ── Line items ───────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Line items</SectionTitle>
              <div className="space-y-3 mb-3">
                {lineFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Fee type</label>}
                      <input {...register(`line_items.${i}.fee_type`)} className={inputCls(errors.line_items?.[i]?.fee_type?.message)} placeholder="Premium" />
                      <FieldError msg={errors.line_items?.[i]?.fee_type?.message} />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>}
                      <input {...register(`line_items.${i}.amount`)} type="number" step="0.01" className={inputCls(errors.line_items?.[i]?.amount?.message)} placeholder="0.00" />
                      <FieldError msg={errors.line_items?.[i]?.amount?.message} />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Qty</label>}
                      <input {...register(`line_items.${i}.quantity`)} type="number" min={1} className={inputCls()} placeholder="1" />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Policy</label>}
                      <input {...register(`line_items.${i}.policy`)} className={inputCls()} placeholder="Optional" />
                    </div>
                    <div className={`col-span-1 flex items-${i === 0 ? 'end pb-1' : 'center'}`}>
                      <button type="button" onClick={() => removeLine(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => appendLine({ fee_type: '', amount: 0, quantity: 1, policy: '' })}
                className="text-sm text-[#1CA0DF] hover:text-[#105778] transition-colors">
                + Add line item
              </button>
            </div>

            {/* ── Coverage lines ───────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Coverage display lines</SectionTitle>
              <div className="space-y-3 mb-3">
                {covFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Coverage type</label>}
                      <input {...register(`coverage_lines.${i}.benefit_type`)} className={inputCls(errors.coverage_lines?.[i]?.benefit_type?.message)} placeholder="Per Occurrence" />
                      <FieldError msg={errors.coverage_lines?.[i]?.benefit_type?.message} />
                    </div>
                    <div className="col-span-6">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Value</label>}
                      <input {...register(`coverage_lines.${i}.benefit_value`)} className={inputCls(errors.coverage_lines?.[i]?.benefit_value?.message)} placeholder="$1 million" />
                      <FieldError msg={errors.coverage_lines?.[i]?.benefit_value?.message} />
                    </div>
                    <div className={`col-span-1 flex items-${i === 0 ? 'end pb-1' : 'center'}`}>
                      <button type="button" onClick={() => removeCov(i)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => appendCov({ benefit_type: '', benefit_value: '' })}
                className="text-sm text-[#1CA0DF] hover:text-[#105778] transition-colors">
                + Add coverage line
              </button>
            </div>

            {/* ── Submit ───────────────────────────────────────────── */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40"
            >
              {mutation.isPending ? 'Creating…' : 'Create Invoice'}
            </button>

          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
