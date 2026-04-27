import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteOptionBtn, QuoteNextBtn } from './QuoteStepLayout'

// ─── US states list ───────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'Washington DC',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteLocationPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  useEffect(() => {
    if (!params.eventDates) navigate('/quote/dates', { replace: true })
  }, [params.eventDates, navigate])

  const isVendor = !!params.isVendor

  const [state,      setState]      = useState(params.event_state ?? '')
  const [privateRes, setPrivateRes] = useState<'Yes' | 'No' | ''>(
    params.privateResidence === 1 ? 'Yes'
      : (params.privateResidence === 0 && params.event_state) ? 'No'
      : ''
  )
  const [error, setError] = useState('')

  // Vendors skip the private residence question — just need a state
  const isValid = isVendor ? state !== '' : (state !== '' && privateRes !== '')

  const handleNext = () => {
    if (!state) { setError('Please select the event state.'); return }
    if (!isVendor && !privateRes) { setError('Please answer the private residence question.'); return }
    setError('')
    setParams({
      event_state:      state,
      privateResidence: isVendor ? 0 : (privateRes === 'Yes' ? 1 : 0),
    })
    // Vendors skip the alcohol page entirely
    navigate(isVendor ? '/quote/guests' : '/quote/alcohol')
  }

  if (!params.eventDates) return null

  return (
    <QuoteStepLayout
      step={3}
      title="What state is the event in?"
      image="/assets/images/quote-state.png"
      backTo={isVendor ? '/quote/vendor-activity' : '/quote/dates'}
    >

      {/* ── State dropdown ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 26 }}>
        <select
          value={state}
          onChange={(e) => { setState(e.target.value); setError('') }}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 10,
            border: '1px solid #DFDFDF',
            padding: '0 40px 0 16px',
            fontSize: 15,
            color: state ? '#262D45' : '#9CA3AF',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundColor: '#fff',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Select State</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <svg width="16" height="16" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* ── Private residence (hidden for vendors) ────────────────────────── */}
      {!isVendor && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 16, textAlign: 'center' }}>
            Is the event held at a private residence?
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['Yes', 'No'] as const).map((opt) => (
              <QuoteOptionBtn
                key={opt}
                active={privateRes === opt}
                onClick={() => { setPrivateRes(opt); setError('') }}
                fullWidth
              >
                {opt}
              </QuoteOptionBtn>
            ))}
          </div>
          {privateRes === 'Yes' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#797979', marginTop: 10 }}>
              An additional surcharge may apply for events at private residences.
            </p>
          )}
        </div>
      )}

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
