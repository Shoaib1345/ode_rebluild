import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import type { QuotePlan, QuotePlans, PolicyLimit } from '../../types'
import QuoteLayout from './QuoteLayout'

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchQuote(params: Record<string, unknown>): Promise<{ plans: QuotePlans }> {
  const res = await api.get<{ plans: QuotePlans }>('/quote', { params })
  return res.data
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  firstOption:  'Basic',
  secondOption: 'Standard',
  thirdOption:  'Enhanced',
  fourthOption: 'Premium',
}

const PLAN_ACCENT: Record<string, string> = {
  firstOption:  'border-slate-300  bg-slate-50',
  secondOption: 'border-[#1CA0DF]   bg-[#EDF0FA]',
  thirdOption:  'border-violet-400 bg-violet-50',
  fourthOption: 'border-emerald-400 bg-emerald-50',
}

const PLAN_BADGE: Record<string, string> = {
  firstOption:  'bg-slate-200  text-slate-700',
  secondOption: 'bg-[#EDF0FA]   text-[#105778]',
  thirdOption:  'bg-violet-100 text-violet-800',
  fourthOption: 'bg-emerald-100 text-emerald-800',
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  slot,
  plan,
  onSelect,
}: {
  slot: string
  plan: QuotePlan
  onSelect: (plan: QuotePlan) => void
}) {
  const label     = PLAN_LABELS[slot]  ?? 'Plan'
  const accent    = PLAN_ACCENT[slot]  ?? 'border-gray-300 bg-gray-50'
  const badge     = PLAN_BADGE[slot]   ?? 'bg-gray-100 text-gray-700'
  const total     = plan.total + (plan.extra_charge ?? 0)

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${accent} ${
        plan.recommended ? 'ring-2 ring-[#1CA0DF] ring-offset-2' : ''
      }`}
    >
      {/* Recommended badge */}
      {plan.recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#1CA0DF] px-3 py-0.5 text-xs font-semibold text-white shadow">
            ★ Recommended
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 pt-8">
        {/* Label + limits */}
        <div className="mb-4">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2 ${badge}`}>
            {label}
          </span>
          <div className="text-lg font-bold text-gray-800">
            ${plan.min_limit}M / ${plan.max_limit}M
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Per-occurrence / Aggregate
          </div>
        </div>

        {/* GL limits */}
        {plan.limits.length > 0 && (
          <ul className="mb-4 space-y-1.5 text-xs text-gray-600">
            {plan.limits.map((l: PolicyLimit, i: number) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="text-gray-500">{l.gl_limit_type}</span>
                <span className="font-medium text-gray-700 whitespace-nowrap">{l.gl_limit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Carrier */}
        <div className="mt-auto mb-4 text-xs text-gray-400">
          Carrier: <span className="font-medium text-gray-600">{plan.carrier}</span>
        </div>

        {/* Price breakdown */}
        <div className="rounded-lg bg-white border border-gray-100 p-3 mb-4 text-xs space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Premium</span>
            <span>{fmt(plan.premium)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Broker fee</span>
            <span>{fmt(plan.broker_fee)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Processing fee</span>
            <span>{fmt(plan.processing_fee)}</span>
          </div>
          {(plan.extra_charge ?? 0) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Private residence</span>
              <span>{fmt(plan.extra_charge)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-100 pt-1 mt-1">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onSelect(plan)}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
            plan.recommended
              ? 'bg-[#1CA0DF] hover:bg-[#1786BB] text-white'
              : 'bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          Select Plan
        </button>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6 animate-pulse">
      <div className="h-4 w-16 rounded bg-gray-200 mb-3" />
      <div className="h-6 w-28 rounded bg-gray-200 mb-2" />
      <div className="h-3 w-20 rounded bg-gray-200 mb-6" />
      <div className="space-y-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-10 w-full rounded-xl bg-gray-200" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotePlansPage() {
  const navigate      = useNavigate()
  const params        = useQuoteStore((s) => s.params)
  const setPlans      = useQuoteStore((s) => s.setPlans)
  const setSelected   = useQuoteStore((s) => s.setSelectedPlan)

  // Guard — must have event type + dates to be here
  useEffect(() => {
    if (!params.eventType || !params.eventDates) {
      navigate('/onedayevent', { replace: true })
    }
  }, [params.eventType, params.eventDates, navigate])

  // Build API query params from store
  const queryParams = {
    event_type:           params.eventType,
    event_state:          params.event_state,
    persons:              params.number_of_persons,
    event_dates:          params.eventDates,
    timezone:             params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    noha:                 params.noha      ? 1 : 0,
    w_o_s:                params.w_o_s     ? 1 : 0,
    p_a_n_c_b:            params.p_a_n_c_b ? 1 : 0,
    host_liquor:          params.host_liquor ? 1 : 0,
    liquor:               params.liquor     ? 1 : 0,
    additional_insureds:  params.additional_insureds ?? 0,
    private_residence:    params.privateResidence ? 1 : 0,
    is_venue:             params.isSetVenue  ? 1 : 0,
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['quote', queryParams],
    queryFn:  () => fetchQuote(queryParams),
    enabled:  !!params.eventType && !!params.eventDates,
    staleTime: Infinity, // don't re-fetch on window focus — params won't change
    retry: 1,
  })

  // Persist plans to store whenever we get results
  useEffect(() => {
    if (data?.plans) setPlans(data.plans)
  }, [data, setPlans])

  const plans   = data?.plans
  const slots   = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'] as const
  const visible = plans ? slots.filter((s) => plans[s] !== null) : []
  const hasAny  = visible.length > 0

  function handleSelect(plan: QuotePlan) {
    setSelected(plan)
    navigate('/quote/info')
  }

  // Sort: recommended first, then by total
  const sortedSlots = [...visible].sort((a, b) => {
    const pa = plans![a]!
    const pb = plans![b]!
    if (pa.recommended && !pb.recommended) return -1
    if (!pa.recommended && pb.recommended) return 1
    return pa.total - pb.total
  })

  return (
    <QuoteLayout step={3}>
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/quote/details')}
          className="text-[#1CA0DF] hover:text-[#105778] text-sm font-medium"
        >
          ← Back
        </button>
        {params.eventTypeName && (
          <span className="text-sm text-gray-500">
            {params.eventTypeName}
            {params.event_state ? ` · ${params.event_state}` : ''}
            {params.eventDates ? ` · ${params.eventDates.split(',')[0]}` : ''}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Select your coverage
      </h1>
      <p className="text-gray-500 mb-7 text-sm">
        All plans include General Liability insurance for your event.
      </p>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <PlanSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Could not load plans</p>
          <p className="text-red-600 text-sm mb-4">
            Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── No results ───────────────────────────────────────────────── */}
      {!isLoading && !isError && plans && !hasAny && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
          <p className="text-amber-800 font-semibold mb-2">
            No online coverage available for these details
          </p>
          <p className="text-amber-700 text-sm mb-4">
            Your event may require a manual review. Please call us at{' '}
            <a href="tel:+18005551234" className="font-semibold underline">
              1-800-555-1234
            </a>{' '}
            and we'll get you a quote within 1 business day.
          </p>
          <button
            type="button"
            onClick={() => navigate('/quote/details')}
            className="px-4 py-2 rounded-lg border border-amber-400 text-amber-800 text-sm font-medium hover:bg-amber-100"
          >
            ← Adjust Details
          </button>
        </div>
      )}

      {/* ── Plans grid ───────────────────────────────────────────────── */}
      {!isLoading && hasAny && (
        <>
          <div className={`grid gap-5 ${sortedSlots.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-2' : 'sm:grid-cols-2'}`}>
            {sortedSlots.map((slot) => (
              <PlanCard
                key={slot}
                slot={slot}
                plan={plans![slot]!}
                onSelect={handleSelect}
              />
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Prices include broker and processing fees. All plans are subject to
            carrier underwriting approval.
          </p>
        </>
      )}
    </QuoteLayout>
  )
}
