import { useState, useEffect, Component } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Error boundary ───────────────────────────────────────────────────────────

class InvoiceErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message }
  }
  render() {
    if (this.state.error) {
      return (
        <AdminLayout>
          <div className="max-w-2xl mx-auto mt-12 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="font-semibold text-red-700 mb-2">Invoice form error</p>
            <p className="text-xs text-red-500 font-mono mb-4">{this.state.error}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Reload
            </button>
          </div>
        </AdminLayout>
      )
    }
    return this.props.children
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const toNum = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v))

const lineItemSchema = z.object({
  fee_type: z.string().min(1, 'Required'),
  amount:   z.preprocess(toNum, z.number().min(0)),
  quantity: z.preprocess(toNum, z.number().int().min(1)),
  policy:   z.string().optional(),
})

const coverageLineSchema = z.object({
  benefit_type:  z.string().min(1, 'Required'),
  benefit_value: z.string().min(1, 'Required'),
})

const schema = z.object({
  lead_id:         z.preprocess(toNum, z.number().int().positive().optional()),
  type:            z.enum(['single', 'multi_plan']),
  first_name:      z.string().min(1, 'Required'),
  last_name:       z.string().min(1, 'Required'),
  email:           z.string().min(1, 'Required').email('Invalid email'),
  email_cc:        z.string().email('Invalid email').or(z.literal('')).optional(),
  email_bcc:       z.string().email('Invalid email').or(z.literal('')).optional(),
  email_subject:   z.string().optional(),
  event_type:      z.string().optional(),
  carrier:         z.string().optional(),
  effective_date:  z.string().optional(),
  expiration_date: z.string().optional(),
  min_limit:       z.preprocess(toNum, z.number().int().min(0).optional()),
  max_limit:       z.preprocess(toNum, z.number().int().min(0).optional()),
  broker_fee:      z.preprocess(toNum, z.number().min(0).optional()),
  processing_fee:  z.preprocess(toNum, z.number().min(0).optional()),
  total_premium:   z.preprocess(toNum, z.number().min(0).optional()),
  total_payable:   z.preprocess(toNum, z.number().min(0, 'Required')),
  street: z.string().optional(),
  suite:  z.string().optional(),
  city:   z.string().optional(),
  state:  z.string().max(2).optional().or(z.literal('')),
  zip:    z.string().max(10).optional(),
  line_items:     z.array(lineItemSchema),
  coverage_lines: z.array(coverageLineSchema),
})

type FormData = z.infer<typeof schema>

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadForInvoice {
  id: number
  first_name: string | null; last_name: string | null
  email: string | null
  street: string | null; city: string | null; zip: string | null
  event_state: string | null; event_date: string | null
  event_type_id: number | null; event_type_label: string | null
  carrier: string | null; no_of_people: number | null
  ins_first_name: string | null; ins_last_name: string | null
  ins_street: string | null; ins_city: string | null
  ins_state: string | null; ins_zip: string | null
  lead_offered_plans: {
    premium?: number; broker_fee?: number; processing_fee?: number
    total?: number; min_limit?: number; max_limit?: number; carrier?: string
  } | null
}

interface GlLimit {
  gl_limit: string
  gl_limit_type: string
}

interface RatePlan {
  rate_id?: number
  carrier: string
  event_type_id?: number | null
  min_audience?: number
  max_audience?: number
  min_limit: number
  max_limit: number
  premium: number
  addons?: number
  additional_audience?: number
  subtotal?: number
  broker_fee: number
  processing_fee: number
  total: number
  limits?: GlLimit[]
  host_liquor?: boolean
  recommended?: boolean
}

interface PlanOptions {
  firstOption:  RatePlan | null
  secondOption: RatePlan | null
  thirdOption:  RatePlan | null
  fourthOption: RatePlan | null
}

const TIER_KEYS = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'] as const
type TierKey = typeof TIER_KEYS[number]

const TIER_LABELS: Record<TierKey, string> = {
  firstOption:  'Option 1',
  secondOption: 'Option 2',
  thirdOption:  'Option 3',
  fourthOption: 'Option 4',
}

// ─── Carrier display constants ────────────────────────────────────────────────

const CARRIER_OPTIONS = [
  { value: '',      label: 'All carriers' },
  { value: 'ASI',   label: 'ASI — Arch Insurance' },
  { value: 'FDEAN', label: 'FDean — US Fire Insurance' },
  { value: 'IH',    label: 'IH — Evanston Insurance' },
]

const CARRIER_BADGE: Record<string, string> = {
  ASI:   'bg-blue-100 text-blue-800 border-blue-200',
  FDEAN: 'bg-purple-100 text-purple-800 border-purple-200',
  IH:    'bg-amber-100 text-amber-800 border-amber-200',
}

const CARRIER_CARD: Record<string, string> = {
  ASI:   'border-blue-200 hover:border-blue-400',
  FDEAN: 'border-purple-200 hover:border-purple-400',
  IH:    'border-amber-200 hover:border-amber-400',
}

const CARRIER_BTN: Record<string, string> = {
  ASI:   'bg-blue-600 hover:bg-blue-700 text-white',
  FDEAN: 'bg-purple-600 hover:bg-purple-700 text-white',
  IH:    'bg-amber-600 hover:bg-amber-700 text-white',
}

// ─── Default values ───────────────────────────────────────────────────────────

function buildDefaults(leadId: number | null, lead: LeadForInvoice | null): FormData {
  if (!lead) {
    return {
      lead_id: leadId ?? undefined,
      type: 'single',
      first_name: '', last_name: '', email: '',
      total_payable: 0,
      line_items:     [{ fee_type: 'Premium', amount: 0, quantity: 1, policy: '' }],
      coverage_lines: [
        { benefit_type: 'Per Occurrence',    benefit_value: '' },
        { benefit_type: 'General Aggregate', benefit_value: '' },
      ],
    } as FormData
  }

  const plan      = lead.lead_offered_plans
  const carrier   = lead.carrier ?? plan?.carrier ?? ''
  const minLimit  = plan?.min_limit ?? 1
  const maxLimit  = plan?.max_limit ?? 2
  const premium   = plan?.premium        ?? 0
  const brokerFee = plan?.broker_fee     ?? 0
  const procFee   = plan?.processing_fee ?? 0
  const total     = plan?.total ?? (premium + brokerFee + procFee)

  const firstName = lead.ins_first_name || lead.first_name || ''
  const lastName  = lead.ins_last_name  || lead.last_name  || ''
  const street    = lead.ins_street     || lead.street     || ''
  const city      = lead.ins_city       || lead.city       || ''
  const state     = lead.ins_state      || lead.event_state || ''
  const zip       = lead.ins_zip        || lead.zip        || ''

  const effDate = lead.event_date ?? ''
  const expDate = (() => {
    if (!effDate) return ''
    try {
      const datePart = effDate.split('T')[0].split(' ')[0]
      const d = new Date(datePart + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    } catch { return '' }
  })()

  const fmt = (n: number) => `$${((n ?? 1) * 1_000_000).toLocaleString()}`

  return {
    lead_id:        lead.id,
    type:           'single',
    first_name:     firstName,
    last_name:      lastName,
    email:          lead.email ?? '',
    email_cc:       '',
    email_bcc:      '',
    email_subject:  `Your One Day Event Insurance — ODE00${lead.id}`,
    event_type:     lead.event_type_label ?? '',
    carrier,
    effective_date:  effDate,
    expiration_date: expDate,
    min_limit:  minLimit,
    max_limit:  maxLimit,
    total_premium:   premium,
    broker_fee:      brokerFee,
    processing_fee:  procFee,
    total_payable:   total,
    street, city, state, zip,
    line_items: [
      { fee_type: 'Premium',        amount: premium,   quantity: 1, policy: '' },
      ...(brokerFee > 0 ? [{ fee_type: 'Broker Fee',     amount: brokerFee, quantity: 1, policy: '' }] : []),
      ...(procFee   > 0 ? [{ fee_type: 'Processing Fee', amount: procFee,   quantity: 1, policy: '' }] : []),
    ],
    coverage_lines: [
      { benefit_type: 'Per Occurrence',         benefit_value: fmt(minLimit) },
      { benefit_type: 'General Aggregate',      benefit_value: fmt(maxLimit) },
      { benefit_type: 'Products/Completed Ops', benefit_value: fmt(maxLimit) },
      { benefit_type: 'Personal & Adv Injury',  benefit_value: fmt(minLimit) },
    ],
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600">{msg}</p>
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-700">{children}</h2>
      {action}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CB371] ${err ? 'border-red-400' : 'border-gray-300'}`

const fmt$ = (n: number) => `$${n.toFixed(2)}`
const fmtM = (n: number | null | undefined) =>
  n ? `$${(n * 1_000_000).toLocaleString()}` : '—'

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  tierLabel,
  mode,
  isSelected,
  onUse,
  onAdd,
}: {
  plan: RatePlan
  tierLabel: string
  mode: 'single' | 'multi_plan'
  isSelected: boolean
  onUse: () => void
  onAdd: () => void
}) {
  const badgeCls = CARRIER_BADGE[plan.carrier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const btnCls   = CARRIER_BTN[plan.carrier]   ?? 'bg-gray-700 hover:bg-gray-800 text-white'

  // Recommended gets a green glow; selected gets a green ring
  const borderCls = plan.recommended
    ? 'border-[#3CB371] shadow-md shadow-green-100'
    : (CARRIER_CARD[plan.carrier] ?? 'border-gray-200 hover:border-gray-400')

  return (
    <div className={`relative rounded-xl border-2 bg-white p-4 transition-all flex flex-col ${borderCls} ${isSelected ? 'ring-2 ring-offset-1 ring-green-400' : ''}`}>

      {/* Tier label row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tierLabel}</span>
        {plan.recommended && (
          <span className="text-[9px] font-bold text-white bg-[#3CB371] px-2 py-0.5 rounded-full whitespace-nowrap">
            ★ Recommended
          </span>
        )}
        {isSelected && !plan.recommended && (
          <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            ✓ Added
          </span>
        )}
      </div>

      {/* Carrier badge */}
      <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mb-2 self-start ${badgeCls}`}>
        {plan.carrier}
        {plan.host_liquor && <span className="ml-1 opacity-60">· Liquor</span>}
      </div>

      {/* Audience range */}
      {plan.min_audience !== undefined && plan.max_audience !== undefined && (
        <p className="text-[10px] text-gray-400 mb-2">
          {plan.min_audience.toLocaleString()}–{plan.max_audience.toLocaleString()} guests
        </p>
      )}

      {/* GL limits — rich descriptors from carriers_gl_limits */}
      <div className="mb-3 space-y-1">
        {(plan.limits && plan.limits.length > 0) ? (
          plan.limits.map((l, i) => (
            <div key={i} className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] text-gray-400 truncate">{l.gl_limit_type}</span>
              <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{l.gl_limit}</span>
            </div>
          ))
        ) : (
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-gray-400">Coverage</span>
            <span className="text-[11px] font-semibold text-gray-700">
              {fmtM(plan.min_limit)} / {fmtM(plan.max_limit)}
            </span>
          </div>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="space-y-0.5 text-xs mb-4 pt-2 border-t border-gray-100 flex-1">
        <div className="flex justify-between text-gray-600">
          <span>Premium</span>
          <span className="font-medium tabular-nums">{fmt$(plan.premium)}</span>
        </div>
        {(plan.addons ?? 0) > 0 && (
          <div className="flex justify-between text-gray-400">
            <span>Add-ons</span>
            <span className="tabular-nums">+{fmt$(plan.addons!)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-400">
          <span>Broker fee</span>
          <span className="tabular-nums">+{fmt$(plan.broker_fee)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Processing (3.5%)</span>
          <span className="tabular-nums">+{fmt$(plan.processing_fee)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 pt-1.5 border-t border-gray-200 text-sm">
          <span>Total</span>
          <span className="tabular-nums">{fmt$(plan.total)}</span>
        </div>
      </div>

      {/* Action button */}
      {mode === 'single' ? (
        <button
          type="button"
          onClick={onUse}
          className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors ${btnCls}`}
        >
          Use This Plan
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          disabled={isSelected}
          className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors ${
            isSelected ? 'bg-green-100 text-green-700 cursor-default' : btnCls
          }`}
        >
          {isSelected ? '✓ Added to invoice' : '+ Add Plan'}
        </button>
      )}
    </div>
  )
}

// ─── Unavailable tier slot ────────────────────────────────────────────────────

function TierEmpty({ tierLabel }: { tierLabel: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 flex flex-col items-center justify-center text-center min-h-[200px] gap-1">
      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{tierLabel}</span>
      <span className="text-xs text-gray-300">Not available</span>
    </div>
  )
}

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export default function InvoiceCreatePage() {
  const [searchParams] = useSearchParams()
  const leadIdParam    = searchParams.get('lead_id')
  const leadId         = leadIdParam ? Number(leadIdParam) : null

  const { data: lead, isPending, isError } = useQuery<LeadForInvoice>({
    queryKey: ['admin-lead-invoice-prefill', leadId],
    queryFn:  () => api.get(`/admin/leads/${leadId}`).then(r => r.data),
    enabled:  !!leadId,
    staleTime: 5 * 60_000,
  })

  if (leadId && (isPending || !lead)) {
    if (isError) {
      return (
        <AdminLayout>
          <div className="max-w-2xl mx-auto mt-12 rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
            <p className="font-semibold text-red-700 mb-2">Could not load lead data</p>
            <p className="text-xs text-gray-500 mb-4">Check that this lead ID exists, then try again.</p>
            <button onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
              Go back
            </button>
          </div>
        </AdminLayout>
      )
    }
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24 gap-3 text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3CB371]" />
          Loading lead data…
        </div>
      </AdminLayout>
    )
  }

  return (
    <InvoiceErrorBoundary>
      <InvoiceForm
        key={lead?.id ?? 'new'}
        leadId={leadId}
        lead={lead ?? null}
      />
    </InvoiceErrorBoundary>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

function InvoiceForm({ leadId, lead }: { leadId: number | null; lead: LeadForInvoice | null }) {
  const navigate     = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Plan picker state ──────────────────────────────────────────────────────
  const [planPickerOpen,  setPlanPickerOpen]  = useState(true)
  const [planCarrier,     setPlanCarrier]     = useState('')
  const [planGuests,      setPlanGuests]      = useState(String(lead?.no_of_people ?? ''))
  const [planState,       setPlanState]       = useState(lead?.event_state ?? '')
  const [planEventTypeId, setPlanEventTypeId] = useState(String(lead?.event_type_id ?? ''))
  const [planHostLiquor,  setPlanHostLiquor]  = useState(false)
  const [planNoha,        setPlanNoha]        = useState(false)
  const [planWos,         setPlanWos]         = useState(false)
  const [planPancb,       setPlanPancb]       = useState(false)
  const [planFetchKey,    setPlanFetchKey]    = useState(0)
  const [hasFetched,      setHasFetched]      = useState(false)
  const [selectedPlans,   setSelectedPlans]   = useState<RatePlan[]>([])

  const { data: planOptions, isFetching: plansLoading } = useQuery<PlanOptions>({
    queryKey: [
      'admin-rate-plans',
      planCarrier, planGuests, planState, planEventTypeId,
      planHostLiquor, planNoha, planWos, planPancb,
      planFetchKey,
    ],
    queryFn: () => api.get('/admin/rates/plans', {
      params: {
        ...(planEventTypeId ? { event_type_id: planEventTypeId } : {}),
        ...(planGuests      ? { no_of_people:  planGuests }      : {}),
        ...(planState       ? { state:         planState }       : {}),
        ...(planCarrier     ? { carrier:        planCarrier }    : {}),
        ...(planHostLiquor  ? { host_liquor: 1 }                 : {}),
        ...(planNoha        ? { noha:        1 }                 : {}),
        ...(planWos         ? { w_o_s:       1 }                 : {}),
        ...(planPancb       ? { p_a_n_c_b:   1 }                 : {}),
      },
    }).then(r => r.data),
    enabled: hasFetched,
    staleTime: 2 * 60_000,
  })

  const planFoundCount = planOptions
    ? TIER_KEYS.filter(k => planOptions[k] !== null).length
    : 0

  const loadPlans = () => {
    if (!hasFetched) setHasFetched(true)
    else setPlanFetchKey(k => k + 1)
  }

  // ── React Hook Form ────────────────────────────────────────────────────────
  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver:      zodResolver(schema) as Resolver<FormData>,
    defaultValues: buildDefaults(leadId, lead),
  })

  const {
    fields: lineFields, append: appendLine, remove: removeLine, replace: replaceLine,
  } = useFieldArray({ control, name: 'line_items' })

  const {
    fields: covFields, append: appendCov, remove: removeCov, replace: replaceCov,
  } = useFieldArray({ control, name: 'coverage_lines' })

  // ── Auto-calculate: processing_fee = ceil((premium + broker) × 3.5%) ──────
  const watchPremium = Number(watch('total_premium') || 0)
  const watchBroker  = Number(watch('broker_fee')    || 0)
  const autoProc     = Math.ceil((watchPremium + watchBroker) * 3.5 / 100)
  const autoTotal    = watchPremium + watchBroker + autoProc

  useEffect(() => {
    setValue('processing_fee', autoProc, { shouldDirty: false, shouldValidate: false })
  }, [autoProc, setValue])

  const invoiceType = watch('type')

  // ── Apply a single plan to all form fields ─────────────────────────────────
  const applyPlan = (plan: RatePlan) => {
    setValue('carrier',        plan.carrier)
    setValue('total_premium',  plan.premium)
    setValue('broker_fee',     plan.broker_fee)
    setValue('processing_fee', plan.processing_fee)
    setValue('total_payable',  plan.total)
    setValue('min_limit',      plan.min_limit)
    setValue('max_limit',      plan.max_limit)

    const lineItems = [
      { fee_type: 'Premium',        amount: plan.premium,        quantity: 1, policy: '' },
      { fee_type: 'Broker Fee',     amount: plan.broker_fee,     quantity: 1, policy: '' },
      { fee_type: 'Processing Fee', amount: plan.processing_fee, quantity: 1, policy: '' },
    ]
    if ((plan.addons ?? 0) > 0) {
      lineItems.splice(1, 0, { fee_type: 'Add-ons', amount: plan.addons!, quantity: 1, policy: '' })
    }
    replaceLine(lineItems)

    // Use rich GL limit descriptors from carriers_gl_limits if available,
    // otherwise fall back to the numeric fmtM helper
    const covLines = (plan.limits && plan.limits.length > 0)
      ? plan.limits.map(l => ({ benefit_type: l.gl_limit_type, benefit_value: l.gl_limit }))
      : [
          { benefit_type: 'Per Occurrence',         benefit_value: fmtM(plan.min_limit) },
          { benefit_type: 'General Aggregate',      benefit_value: fmtM(plan.max_limit) },
          { benefit_type: 'Products/Completed Ops', benefit_value: fmtM(plan.max_limit) },
          { benefit_type: 'Personal & Adv Injury',  benefit_value: fmtM(plan.min_limit) },
        ]
    replaceCov(covLines)
  }

  // ── Multi-plan basket ──────────────────────────────────────────────────────
  const addPlan = (plan: RatePlan) => {
    setSelectedPlans(prev => {
      const dup = prev.some(p => p.rate_id === plan.rate_id && p.carrier === plan.carrier)
      return dup ? prev : [...prev, plan]
    })
  }

  const removePlanAt = (i: number) =>
    setSelectedPlans(prev => prev.filter((_, idx) => idx !== i))

  // ── Mutation ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/admin/invoices', {
        ...data,
        ...(invoiceType === 'multi_plan' && selectedPlans.length > 0
          ? { plans: selectedPlans }
          : {}),
      }).then(r => r.data as { id: number }),
    onSuccess: inv => navigate(`/admin/invoices/${inv.id}`),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSubmitError(msg ?? 'Failed to create invoice.')
    },
  })

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(leadId ? `/admin/leads/${leadId}` : '/admin/invoices')}
              className="text-xs text-[#3CB371] hover:text-green-700 mb-1 block"
            >
              ← {leadId ? `Back to Lead ODE00${leadId}` : 'Back to invoices'}
            </button>
            <h1 className="text-xl font-bold text-gray-800">New Invoice</h1>
          </div>
          {lead && (
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full font-medium">
              Pre-filled from ODE00{lead.id}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit(d => { setSubmitError(null); mutation.mutate(d) })} noValidate>
          <div className="space-y-5">

            {/* ── Invoice type ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex items-center gap-6">
              <span className="text-sm font-semibold text-gray-700 mr-2">Invoice type</span>
              {(['single', 'multi_plan'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={t}
                    {...register('type')}
                    className="accent-[#3CB371]"
                  />
                  <span className="text-sm text-gray-700">
                    {t === 'single' ? 'Single plan' : 'Multi-plan (customer chooses)'}
                  </span>
                </label>
              ))}
              <div className="ml-auto">
                <input {...register('lead_id')} type="hidden" />
              </div>
            </div>

            {/* ══ PLAN PICKER ════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

              {/* Collapsible header */}
              <button
                type="button"
                onClick={() => setPlanPickerOpen(o => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">Plan Picker</span>
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    Select a rate from the database
                  </span>
                </div>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${planPickerOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {planPickerOpen && (
                <div className="px-6 pb-6 border-t border-gray-100">

                  {/* ── Filter row 1: carrier · guests · state · event type ── */}
                  <div className="flex flex-wrap items-end gap-3 pt-4 mb-3">
                    <div className="flex-1 min-w-[160px]">
                      <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                      <select
                        value={planCarrier}
                        onChange={e => setPlanCarrier(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
                      >
                        {CARRIER_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="block text-xs text-gray-500 mb-1">Guests</label>
                      <input
                        type="number"
                        value={planGuests}
                        onChange={e => setPlanGuests(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">State</label>
                      <input
                        type="text"
                        value={planState}
                        onChange={e => setPlanState(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="CA"
                        maxLength={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CB371] uppercase"
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-xs text-gray-500 mb-1">Event type ID</label>
                      <input
                        type="number"
                        value={planEventTypeId}
                        onChange={e => setPlanEventTypeId(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CB371]"
                      />
                    </div>
                  </div>

                  {/* ── Filter row 2: add-on checkboxes + Load button ── */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="text-xs text-gray-400 font-medium">Add-ons:</span>
                    {[
                      { key: 'hostLiquor', label: 'Host liquor',    val: planHostLiquor, set: setPlanHostLiquor },
                      { key: 'noha',       label: 'NOHA',           val: planNoha,       set: setPlanNoha       },
                      { key: 'wos',        label: 'W/O/S',          val: planWos,        set: setPlanWos        },
                      { key: 'pancb',      label: 'P/A/N/C/B',      val: planPancb,      set: setPlanPancb      },
                    ].map(({ key, label, val, set }) => (
                      <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={e => set(e.target.checked)}
                          className="accent-[#3CB371] h-3.5 w-3.5"
                        />
                        <span className="text-xs text-gray-600">{label}</span>
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={loadPlans}
                      disabled={plansLoading}
                      className="ml-auto px-5 py-2 bg-[#3CB371] hover:bg-[#2e9a5e] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {plansLoading && (
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full" />
                      )}
                      {plansLoading ? 'Calculating…' : 'Load Plans'}
                    </button>

                    {hasFetched && !plansLoading && planOptions && (
                      <span className="text-xs text-gray-400">
                        {planFoundCount} of 4 tier{planFoundCount !== 1 ? 's' : ''} available
                      </span>
                    )}
                  </div>

                  {/* ── States ── */}
                  {!hasFetched && (
                    <p className="text-sm text-gray-400 text-center py-8">
                      Fill in your filters and click <strong>Load Plans</strong> to see the four coverage tiers.
                    </p>
                  )}

                  {hasFetched && plansLoading && (
                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-[#3CB371] rounded-full" />
                      Running plan builder…
                    </div>
                  )}

                  {hasFetched && !plansLoading && planFoundCount === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No matching rates found. Try broadening your filters (remove add-ons, change state, or adjust guest count).
                    </p>
                  )}

                  {/* ── 4-tier plan columns ── */}
                  {hasFetched && !plansLoading && planOptions && planFoundCount > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {TIER_KEYS.map(tier => {
                        const plan = planOptions[tier]
                        if (!plan) return <TierEmpty key={tier} tierLabel={TIER_LABELS[tier]} />
                        const isSelected = selectedPlans.some(
                          p => p.rate_id === plan.rate_id && p.carrier === plan.carrier
                        )
                        return (
                          <PlanCard
                            key={tier}
                            plan={plan}
                            tierLabel={TIER_LABELS[tier]}
                            mode={invoiceType}
                            isSelected={isSelected}
                            onUse={() => applyPlan(plan)}
                            onAdd={() => addPlan(plan)}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ══ SELECTED PLANS (multi-plan mode) ════════════════════════════ */}
            {invoiceType === 'multi_plan' && (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                <SectionTitle>
                  Selected plans
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (customer will choose one when paying)
                  </span>
                </SectionTitle>

                {selectedPlans.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">
                    No plans added yet. Open the Plan Picker above and click <strong>+ Add Plan</strong>.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPlans.map((p, i) => {
                      const badge = CARRIER_BADGE[p.carrier] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                      return (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge}`}>
                              {p.carrier}
                            </span>
                            <span className="text-sm text-gray-700">
                              {fmtM(p.min_limit)}/{fmtM(p.max_limit)} limits
                            </span>
                            <span className="text-xs text-gray-500">
                              {p.min_audience}–{p.max_audience} guests
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Premium: {fmt$(p.premium)} · Broker: {fmt$(p.broker_fee)} · Proc: {fmt$(p.processing_fee)}</p>
                              <p className="text-sm font-semibold text-gray-800">Total {fmt$(p.total)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePlanAt(i)}
                              className="text-gray-300 hover:text-red-500 transition-colors text-lg"
                              title="Remove plan"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ RECIPIENT ════════════════════════════════════════════════════ */}
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
                  <input {...register('email_cc')} type="email" className={inputCls()} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">BCC</label>
                  <input {...register('email_bcc')} type="email" className={inputCls()} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email subject</label>
                <input {...register('email_subject')} className={inputCls()} />
              </div>
            </div>

            {/* ══ COVERAGE DETAILS ════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Coverage details</SectionTitle>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Event type</label>
                  <input {...register('event_type')} className={inputCls()} placeholder="e.g. Wedding" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Carrier</label>
                  <input {...register('carrier')} className={inputCls()} placeholder="e.g. ASI" />
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
                  <label className="block text-xs text-gray-500 mb-1">Min limit (millions)</label>
                  <input {...register('min_limit')} type="number" className={inputCls()} placeholder="1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max limit (millions)</label>
                  <input {...register('max_limit')} type="number" className={inputCls()} placeholder="2" />
                </div>
              </div>
            </div>

            {/* ══ PRICING ══════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>
                Pricing
                <span className="text-[11px] font-normal text-gray-400">
                  Processing fee auto-calculates at 3.5% of (premium + broker fee)
                </span>
              </SectionTitle>

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

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Processing fee ($)
                    <span className="ml-1 text-[#3CB371] font-semibold">auto</span>
                  </label>
                  <input
                    {...register('processing_fee')}
                    type="number" step="0.01"
                    className={inputCls() + ' bg-green-50'}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Total payable ($) *</label>
                  <input
                    {...register('total_payable')}
                    type="number" step="0.01"
                    className={inputCls(errors.total_payable?.message)}
                    placeholder="0.00"
                  />
                  <FieldError msg={errors.total_payable?.message} />
                </div>
              </div>

              {/* Auto-sum hint */}
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                <svg className="h-3.5 w-3.5 text-[#3CB371] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggested total: <strong className="text-gray-600">{fmt$(autoTotal)}</strong>
                &nbsp;=&nbsp;{fmt$(watchPremium)} premium + {fmt$(watchBroker)} broker + {fmt$(autoProc)} processing
                {Math.abs(Number(watch('total_payable') || 0) - autoTotal) > 0.01 && (
                  <button
                    type="button"
                    onClick={() => setValue('total_payable', autoTotal)}
                    className="ml-auto text-[#3CB371] hover:text-green-700 font-semibold underline"
                  >
                    Use suggested
                  </button>
                )}
              </div>
            </div>

            {/* ══ ADDRESS ══════════════════════════════════════════════════════ */}
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

            {/* ══ LINE ITEMS ════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Line items</SectionTitle>
              <div className="space-y-3 mb-3">
                {lineFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Fee type</label>}
                      <input
                        {...register(`line_items.${i}.fee_type`)}
                        className={inputCls(errors.line_items?.[i]?.fee_type?.message)}
                        placeholder="Premium"
                      />
                      <FieldError msg={errors.line_items?.[i]?.fee_type?.message} />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>}
                      <input
                        {...register(`line_items.${i}.amount`)}
                        type="number" step="0.01"
                        className={inputCls()}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Qty</label>}
                      <input
                        {...register(`line_items.${i}.quantity`)}
                        type="number" min={1}
                        className={inputCls()}
                        placeholder="1"
                      />
                    </div>
                    <div className="col-span-2">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Policy</label>}
                      <input
                        {...register(`line_items.${i}.policy`)}
                        className={inputCls()}
                        placeholder="Optional"
                      />
                    </div>
                    <div className={`col-span-1 flex items-${i === 0 ? 'end pb-1' : 'center'}`}>
                      <button type="button" onClick={() => removeLine(i)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => appendLine({ fee_type: '', amount: 0, quantity: 1, policy: '' })}
                className="text-sm text-[#3CB371] hover:text-green-700">
                + Add line item
              </button>
            </div>

            {/* ══ COVERAGE DISPLAY LINES ════════════════════════════════════════ */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <SectionTitle>Coverage display lines</SectionTitle>
              <div className="space-y-3 mb-3">
                {covFields.map((field, i) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Coverage type</label>}
                      <input
                        {...register(`coverage_lines.${i}.benefit_type`)}
                        className={inputCls(errors.coverage_lines?.[i]?.benefit_type?.message)}
                        placeholder="Per Occurrence"
                      />
                      <FieldError msg={errors.coverage_lines?.[i]?.benefit_type?.message} />
                    </div>
                    <div className="col-span-6">
                      {i === 0 && <label className="block text-xs text-gray-400 mb-1">Value</label>}
                      <input
                        {...register(`coverage_lines.${i}.benefit_value`)}
                        className={inputCls(errors.coverage_lines?.[i]?.benefit_value?.message)}
                        placeholder="$1,000,000"
                      />
                      <FieldError msg={errors.coverage_lines?.[i]?.benefit_value?.message} />
                    </div>
                    <div className={`col-span-1 flex items-${i === 0 ? 'end pb-1' : 'center'}`}>
                      <button type="button" onClick={() => removeCov(i)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button"
                onClick={() => appendCov({ benefit_type: '', benefit_value: '' })}
                className="text-sm text-[#3CB371] hover:text-green-700">
                + Add coverage line
              </button>
            </div>

            {/* ══ SUBMIT ════════════════════════════════════════════════════════ */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {invoiceType === 'multi_plan' && selectedPlans.length === 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                ⚠ Multi-plan invoice has no plans added yet. Use the Plan Picker above to add at least one plan option for the customer.
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 rounded-lg bg-[#3CB371] hover:bg-[#2e9a5e] text-white font-semibold text-sm transition-colors disabled:opacity-40"
            >
              {mutation.isPending ? 'Creating…' : 'Create & Send Invoice'}
            </button>

          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
