import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteOptionBtn, QuoteNextBtn } from './QuoteStepLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

type AlcoholType = 'Sold' | 'Served' | 'BYOB' | 'no_alcohol'

const ALCOHOL_OPTIONS: { value: AlcoholType; label: string; info: string }[] = [
  { value: 'Sold',       label: 'Sold',       info: 'When alcohol is sold to guests at the event.'          },
  { value: 'Served',     label: 'Served',     info: 'When alcohol is provided to guests at no charge.'      },
  { value: 'BYOB',       label: 'B.Y.O.B',   info: 'When guests bring their own liquor and/or beer.'       },
  { value: 'no_alcohol', label: 'No Alcohol', info: 'When there is absolutely no alcohol at the event.'     },
]

// ─── Info-icon tooltip ────────────────────────────────────────────────────────

function InfoPop({ text, active }: { text: string; active: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((s) => !s) }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: active ? 'rgba(255,255,255,0.30)' : 'rgba(28,160,221,0.15)',
          border: 'none',
          color: active ? '#fff' : '#1087c3',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          lineHeight: '18px',
          textAlign: 'center',
          padding: 0,
          flexShrink: 0,
        }}
        aria-label="More information"
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 190,
            backgroundColor: '#262D45',
            color: '#fff',
            fontSize: 12,
            borderRadius: 8,
            padding: '8px 10px',
            zIndex: 50,
            boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
            lineHeight: '17px',
            textAlign: 'left',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
      )}
    </span>
  )
}

// ─── Alcohol → API field computation ─────────────────────────────────────────

function computeAlcoholFlags(
  alcohol: AlcoholType,
  profitable: 'Yes' | 'No' | '',
): { liquor: 0 | 1; host_liquor: 0 | 1 } {
  if (alcohol === 'Sold') {
    if (profitable === 'No') return { liquor: 0, host_liquor: 1 }
    return { liquor: 1, host_liquor: 0 }
  }
  if (alcohol === 'Served' || alcohol === 'BYOB') {
    return { liquor: 0, host_liquor: 1 }
  }
  return { liquor: 0, host_liquor: 0 }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteAlcoholPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  useEffect(() => {
    if (!params.event_state) navigate('/quote/location', { replace: true })
    // Vendors skip the alcohol step — send them straight to guests
    else if (params.isVendor) navigate('/quote/guests', { replace: true })
  }, [params.event_state, params.isVendor, navigate])

  const [alcohol,      setAlcohol]      = useState<AlcoholType | ''>((params.alcohol_served as AlcoholType) ?? '')
  const [profitable,   setProfitable]   = useState<'Yes' | 'No' | ''>((params.is_sold_profitable as 'Yes' | 'No') ?? '')
  const [ticketCharge, setTicketCharge] = useState<'Yes' | 'No' | ''>((params.is_charge_ticket as 'Yes' | 'No') ?? '')
  const [error,        setError]        = useState('')

  const showProfitable   = alcohol === 'Sold'
  const showTicketCharge = alcohol === 'Served' || (alcohol === 'Sold' && profitable === 'No')

  const isValid =
    alcohol !== '' &&
    (!showProfitable   || profitable   !== '') &&
    (!showTicketCharge || ticketCharge !== '')

  const handleAlcoholSelect = (val: AlcoholType) => {
    setAlcohol(val)
    setError('')
    if (val !== 'Sold') setProfitable('')
    if (val === 'no_alcohol' || val === 'BYOB') setTicketCharge('')
  }

  const handleNext = () => {
    if (!isValid) { setError('Please complete all required selections.'); return }
    const { liquor, host_liquor } = computeAlcoholFlags(alcohol as AlcoholType, profitable)
    setParams({
      alcohol_served:     alcohol,
      is_sold_profitable: profitable,
      is_charge_ticket:   ticketCharge,
      liquor,
      host_liquor,
    })
    navigate('/quote/guests')
  }

  if (!params.event_state) return null

  return (
    <QuoteStepLayout
      step={4}
      title="Alcohol at the event will be"
      image="/assets/images/quote-alchohal.png"
      backTo="/quote/location"
    >

      {/* ── Alcohol type — 4 buttons in one horizontal row ───────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {ALCOHOL_OPTIONS.map((opt) => {
          const active = alcohol === opt.value
          return (
            <div
              key={opt.value}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {/* Info icon row */}
              <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <InfoPop text={opt.info} active={active} />
              </div>

              {/* Selection button */}
              <button
                type="button"
                onClick={() => handleAlcoholSelect(opt.value)}
                style={{
                  width: '100%',
                  lineHeight: '54px',
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                  borderRadius: 10,
                  border: active ? '1px solid #E0232C' : '1px solid #105778',
                  backgroundColor: active ? '#E0232C' : '#fff',
                  color: active ? '#fff' : '#262D45',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                  padding: '0 4px',
                }}
              >
                {opt.label}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Follow-up: Profitable? ───────────────────────────────────────── */}
      {showProfitable && (
        <div
          style={{
            borderRadius: 10,
            border: '1px solid #E3E3E3',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 12, textAlign: 'center' }}>
            Will you make a profit from these sales?
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['Yes', 'No'] as const).map((opt) => (
              <QuoteOptionBtn
                key={opt}
                active={profitable === opt}
                onClick={() => { setProfitable(opt); setError('') }}
                fullWidth
              >
                {opt}
              </QuoteOptionBtn>
            ))}
          </div>
        </div>
      )}

      {/* ── Follow-up: Ticket charge? ────────────────────────────────────── */}
      {showTicketCharge && (
        <div
          style={{
            borderRadius: 10,
            border: '1px solid #E3E3E3',
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 12, textAlign: 'center' }}>
            Is there a ticket charge for this event?
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['Yes', 'No'] as const).map((opt) => (
              <QuoteOptionBtn
                key={opt}
                active={ticketCharge === opt}
                onClick={() => { setTicketCharge(opt); setError('') }}
                fullWidth
              >
                {opt}
              </QuoteOptionBtn>
            ))}
          </div>
        </div>
      )}

      {/* ── Hint text (matches ode_new ODE4 <p> at bottom) ──────────────── */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#797979', marginBottom: 4, marginTop: 8 }}>
        If you think there might be liquor, click &ldquo;served&rdquo; just to be safe!
      </p>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <p style={{ textAlign: 'center', color: '#E0232C', fontSize: 13, marginBottom: 8 }}>
          {error}
        </p>
      )}

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!isValid} />

    </QuoteStepLayout>
  )
}
