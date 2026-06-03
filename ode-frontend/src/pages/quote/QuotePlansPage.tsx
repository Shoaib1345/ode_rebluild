import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import { shouldManualQuote } from '../../lib/manualQuote'
import type { QuotePlan, QuotePlans, PolicyLimit } from '../../types'
import QuoteLayout from './QuoteLayout'

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchQuote(params: Record<string, unknown>): Promise<{ plans: QuotePlans }> {
  const res = await api.get<{ plans: QuotePlans }>('/quote', { params })
  return res.data
}

// ─── Slot config ─────────────────────────────────────────────────────────────
// Displayed left-to-right: small coverage → RECOMMENDED → higher → highest

const SLOT_ORDER = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'] as const

// Exact ode_new card colors per slot; the recommended plan overrides to red.
const SLOT_COLOR: Record<string, string> = {
  firstOption:  '#2C9FD9',   // blue
  secondOption: '#F59D0E',   // orange
  thirdOption:  '#009345',   // green
  fourthOption: '#36326C',   // navy
}
const REC_COLOR = '#E0232C'  // maroon/red — the recommended card

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
  const color  = plan.recommended ? REC_COLOR : (SLOT_COLOR[slot] ?? '#2C9FD9')
  const total  = plan.total + (plan.extra_charge ?? 0)
  const price  = Math.round(total)          // integer, no dollar sign
  const isRec  = plan.recommended

  // Coverage rows — from the plan's GL limits, with a sensible fallback.
  const rows: { label: string; value: string }[] = plan.limits.length > 0
    ? plan.limits.map((l: PolicyLimit) => ({ label: l.gl_limit_type, value: l.gl_limit }))
    : [
        { label: 'Per Occurrence', value: `$${plan.min_limit} million` },
        { label: 'Aggregate',      value: `$${plan.max_limit} million` },
      ]

  return (
    // The recommended card sticks up (banner) and down (rounded foot) past the
    // others; non-recommended cards get top padding so their bodies align.
    <div style={{ position: 'relative', paddingTop: isRec ? 0 : 30 }}>

      {/* ── RECOMMENDED banner (recommended only) ─────────────────────── */}
      {isRec && (
        <div
          style={{
            backgroundColor: REC_COLOR,
            color: '#fff',
            textAlign: 'center',
            textTransform: 'uppercase',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '1px',
            height: 40,
            lineHeight: '40px',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 10px rgba(187,187,187,0.45)',
          }}
        >
          Recommended
        </div>
      )}

      {/* ── Card body (.section) ──────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: isRec ? '#fff' : '#EFEFEF',
          boxShadow: isRec ? '0 0 10px #bbb' : '0 0 20px #bbb',
          borderRadius: isRec ? 0 : 10,
          padding: '24px 18px 18px',
        }}
      >
        {/* "BEST PLAN" (recommended only) */}
        {isRec && (
          <h3 style={{ textAlign: 'center', textTransform: 'uppercase', fontWeight: 600, fontSize: 18, marginBottom: 18 }}>
            <span style={{ color: REC_COLOR, borderBottom: `2px solid ${REC_COLOR}`, paddingBottom: 2 }}>Best Plan</span>
          </h3>
        )}

        {/* Colored limit header (.price) */}
        <div
          style={{
            backgroundColor: color,
            color: '#fff',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: 17,
            height: 50,
            lineHeight: '50px',
            borderRadius: 8,
            marginBottom: 18,
          }}
        >
          {plan.min_limit} Million / {plan.max_limit} Million
        </div>

        {/* Coverage rows */}
        <ul style={{ listStyle: 'none', margin: '0 0 18px', padding: 0 }}>
          {rows.map((row, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 0',
                fontSize: 13.5,
              }}
            >
              <span style={{ color: '#6B6B6B' }}>{row.label}:</span>
              <span style={{ color: '#4A4A4A', fontWeight: 600 }}>{row.value}</span>
            </li>
          ))}
        </ul>

        {/* Colored price block (.total) */}
        <div
          style={{
            backgroundColor: color,
            color: '#fff',
            textAlign: 'center',
            borderRadius: 8,
            padding: '14px 10px',
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.95 }}>Price</div>
          <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.05 }}>{price}</div>
        </div>

        {/* Buy Now — outlined (fills on hover); filled for recommended */}
        <button
          type="button"
          onClick={() => onSelect(plan)}
          onMouseEnter={(e) => { if (!isRec) { e.currentTarget.style.backgroundColor = color; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={(e) => { if (!isRec) { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = color } }}
          style={{
            display: 'block',
            width: '100%',
            height: 50,
            borderRadius: 40,
            border: `1px solid ${isRec ? REC_COLOR : color}`,
            backgroundColor: isRec ? REC_COLOR : '#fff',
            color: isRec ? '#fff' : color,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s',
          }}
        >
          Buy Now
        </button>
      </div>

      {/* ── Rounded foot (recommended only) ───────────────────────────── */}
      {isRec && (
        <div style={{ height: 26, backgroundColor: '#fff', borderRadius: '0 0 20px 20px', boxShadow: '0 16px 22px rgba(187,187,187,0.45)' }} />
      )}
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PlanSkeleton({ raised }: { raised?: boolean }) {
  return (
    <div style={{ paddingTop: raised ? 0 : 32 }}>
      <div
        className="animate-pulse"
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid #E3E3E3',
          background: '#fff',
        }}
      >
        <div style={{ height: 48, backgroundColor: '#E5E7EB' }} />
        <div style={{ padding: '12px 18px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <div style={{ height: 12, width: '45%', backgroundColor: '#F3F4F6', borderRadius: 4 }} />
              <div style={{ height: 12, width: '30%', backgroundColor: '#F3F4F6', borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div style={{ margin: '0 14px 14px', height: 76, backgroundColor: '#E5E7EB', borderRadius: 10 }} />
        <div style={{ margin: '0 14px 18px', height: 42, backgroundColor: '#F3F4F6', borderRadius: 40 }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuotePlansPage() {
  const navigate    = useNavigate()
  const params      = useQuoteStore((s) => s.params)
  const setPlans    = useQuoteStore((s) => s.setPlans)
  const setSelected = useQuoteStore((s) => s.setSelectedPlan)

  useEffect(() => {
    if (!params.eventType || !params.eventDates) {
      navigate('/onedayevent', { replace: true })
    } else if (shouldManualQuote(params)) {
      // Defensive: higher-risk events never see online plans.
      navigate('/quote/manual-review', { replace: true })
    }
  }, [params, navigate])

  const queryParams = {
    event_type:          params.eventType,
    event_state:         params.event_state,
    persons:             params.number_of_persons,
    event_dates:         params.eventDates,
    timezone:            params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    noha:                params.noha       ? 1 : 0,
    w_o_s:               params.w_o_s      ? 1 : 0,
    p_a_n_c_b:           params.p_a_n_c_b  ? 1 : 0,
    host_liquor:         params.host_liquor ? 1 : 0,
    liquor:              params.liquor      ? 1 : 0,
    additional_insureds: params.additional_insureds ?? 0,
    private_residence:   params.privateResidence ? 1 : 0,
    is_venue:            params.isSetVenue   ? 1 : 0,
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['quote', queryParams],
    queryFn:   () => fetchQuote(queryParams),
    enabled:   !!params.eventType && !!params.eventDates,
    staleTime: Infinity,
    retry: 1,
  })

  useEffect(() => {
    if (data?.plans) setPlans(data.plans)
  }, [data, setPlans])

  const plans = data?.plans

  // Show in natural slot order: firstOption → secondOption (rec) → thirdOption → fourthOption
  const visibleSlots = SLOT_ORDER.filter((s) => plans && plans[s] !== null)
  const hasAny = visibleSlots.length > 0

  // Which slot index is the recommended one (for skeleton sizing)
  const recIdx = plans ? visibleSlots.findIndex((s) => plans[s]?.recommended) : 1

  function handleSelect(plan: QuotePlan) {
    setSelected(plan)
    navigate('/quote/insured')
  }

  return (
    <QuoteLayout step={8} wide>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <h1
        style={{
          textAlign: 'center',
          fontSize: 26,
          fontWeight: 900,
          color: '#262D45',
          marginBottom: 32,
        }}
      >
        Select your limits of coverage:
      </h1>

      {/* ── Loading skeletons ─────────────────────────────────────────── */}
      {isLoading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
          className="sm:grid-cols-2 lg:grid-cols-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <PlanSkeleton key={i} raised={i === recIdx} />
          ))}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {isError && (
        <div
          style={{
            borderRadius: 16,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#B91C1C', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
            Could not load plans
          </p>
          <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 20 }}>
            Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              background: '#DC2626',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── No results ────────────────────────────────────────────────── */}
      {!isLoading && !isError && plans && !hasAny && (
        <div
          style={{
            borderRadius: 16,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            padding: 32,
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#92400E', fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
            No online coverage available for these details
          </p>
          <p style={{ color: '#B45309', fontSize: 14, marginBottom: 20 }}>
            Your event may require manual review. Please call{' '}
            <a href="tel:+14082176787" style={{ fontWeight: 700 }}>408-217-6787</a>{' '}
            and we'll get you a quote within 1 business day.
          </p>
          <button
            type="button"
            onClick={() => navigate('/quote/addons')}
            style={{
              padding: '10px 28px',
              borderRadius: 10,
              border: '2px solid #F59E0B',
              color: '#92400E',
              background: 'transparent',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ← Adjust Details
          </button>
        </div>
      )}

      {/* ── Plans grid ────────────────────────────────────────────────── */}
      {!isLoading && hasAny && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${visibleSlots.length}, 1fr)`,
              gap: 16,
              alignItems: 'start',
            }}
          >
            {visibleSlots.map((slot) => (
              <PlanCard
                key={slot}
                slot={slot}
                plan={plans![slot]!}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Trust badges */}
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            {[
              { icon: '🛡️', text: 'A-rated carriers only' },
              { icon: '⚡', text: 'Certificate issued same day' },
              { icon: '💳', text: 'All prices include fees & taxes' },
            ].map(({ icon, text }) => (
              <span
                key={text}
                style={{ fontSize: 13, color: '#797979', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {icon} {text}
              </span>
            ))}
          </div>
        </>
      )}

    </QuoteLayout>
  )
}
