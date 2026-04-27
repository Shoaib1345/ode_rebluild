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

// ─── Slot config ─────────────────────────────────────────────────────────────
// Displayed left-to-right: small coverage → RECOMMENDED → higher → highest

const SLOT_ORDER = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'] as const

const SLOT_COLOR: Record<string, string> = {
  firstOption:  '#1CA0DF',   // blue
  secondOption: '#E0232C',   // red (recommended)
  thirdOption:  '#28A745',   // green
  fourthOption: '#1a237e',   // dark navy
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
  const color  = plan.recommended ? '#E0232C' : (SLOT_COLOR[slot] ?? '#1CA0DF')
  const total  = plan.total + (plan.extra_charge ?? 0)
  const price  = Math.round(total)          // integer, no dollar sign
  const isRec  = plan.recommended

  return (
    // Outer wrapper — extra top padding on non-recommended cards to
    // leave room for the RECOMMENDED badge (which floats above the rec card)
    <div style={{ position: 'relative', paddingTop: isRec ? 0 : 32 }}>

      {/* ── RECOMMENDED badge ────────────────────────────────────────── */}
      {isRec && (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-block',
              backgroundColor: '#E0232C',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '6px 20px',
              borderRadius: 20,
            }}
          >
            RECOMMENDED
          </span>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
          border: isRec ? '2px solid #E0232C' : '1px solid #E3E3E3',
          boxShadow: isRec
            ? '0 10px 32px rgba(224,35,44,0.22)'
            : '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        {/* "BEST PLAN" label (recommended card only) */}
        {isRec && (
          <div
            style={{
              textAlign: 'center',
              padding: '12px 16px 8px',
              color: '#E0232C',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.5px',
              textDecoration: 'underline',
            }}
          >
            BEST PLAN
          </div>
        )}

        {/* ── Colored header band ──────────────────────────────────── */}
        <div
          style={{
            backgroundColor: color,
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#fff',
              fontWeight: 800,
              fontSize: 16,
              lineHeight: '22px',
            }}
          >
            {plan.min_limit} Million / {plan.max_limit} Million
          </p>
        </div>

        {/* ── Coverage detail rows ─────────────────────────────────── */}
        <div style={{ padding: '12px 18px 8px' }}>
          {plan.limits.length > 0
            ? plan.limits.map((l: PolicyLimit, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    borderBottom: i < plan.limits.length - 1 ? '1px solid #F3F3F3' : 'none',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#505458' }}>{l.gl_limit_type}:</span>
                  <span style={{ color: '#505458', fontWeight: 600 }}>{l.gl_limit}</span>
                </div>
              ))
            : (
              // Fallback when limits array is empty
              <>
                {[
                  { label: 'Per Occurrence', value: `$${plan.min_limit} million` },
                  { label: 'Aggregate',      value: `$${plan.max_limit} million` },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 0',
                      fontSize: 13,
                      borderBottom: '1px solid #F3F3F3',
                    }}
                  >
                    <span style={{ color: '#505458' }}>{row.label}:</span>
                    <span style={{ color: '#505458', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </>
            )
          }
        </div>

        {/* ── Price box ────────────────────────────────────────────── */}
        <div style={{ padding: '0 14px 14px' }}>
          <div
            style={{
              backgroundColor: color,
              borderRadius: 10,
              padding: '12px 16px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '1px' }}>
              PRICE
            </p>
            <p style={{ color: '#fff', fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
              {price}
            </p>
          </div>
        </div>

        {/* ── Buy Now button ───────────────────────────────────────── */}
        <div style={{ padding: '0 14px 18px' }}>
          <button
            type="button"
            onClick={() => onSelect(plan)}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 40,
              border: isRec ? 'none' : '1px solid #CCCCCC',
              backgroundColor: isRec ? '#E0232C' : 'transparent',
              color: isRec ? '#fff' : '#505458',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
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
    }
  }, [params.eventType, params.eventDates, navigate])

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
    navigate('/quote/info')
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
