import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Quick-pick guest counts ──────────────────────────────────────────────────

const GUEST_PICKS = [25, 50, 100, 150, 200, 300, 500, 1000]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteGuestsPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  const isVendor = !!params.isVendor

  useEffect(() => {
    // Vendors arrive from /quote/location (skipping alcohol), others from /quote/alcohol
    if (!isVendor && !params.alcohol_served) navigate('/quote/alcohol', { replace: true })
    if (isVendor && !params.event_state)      navigate('/quote/location', { replace: true })
  }, [isVendor, params.alcohol_served, params.event_state, navigate])

  const [guests, setGuests] = useState<string>(
    params.number_of_persons ? String(params.number_of_persons) : ''
  )
  const [error, setError] = useState('')

  const num     = parseInt(guests, 10)
  const isValid = guests !== '' && !Number.isNaN(num) && num > 0

  const handleNext = () => {
    if (!isValid) { setError('Please enter a number greater than 0.'); return }
    setError('')
    setParams({ number_of_persons: num })
    navigate(isVendor ? '/quote/addons' : '/quote/activities')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext()
  }

  if (!isVendor && !params.alcohol_served) return null
  if (isVendor && !params.event_state)     return null

  // Different subtitle for vendors
  const subtitle = isVendor
    ? 'Enter the estimated number of people you will provide vending services for at the event.'
    : 'Enter the maximum expected attendance — this ensures your coverage is accurate.'

  return (
    <QuoteStepLayout
      step={5}
      title="How many guests will be attending?"
      image="/assets/images/quote-guests.png"
      imageLarge
      backTo={isVendor ? '/quote/location' : '/quote/alcohol'}
    >

      {/* ── Number input ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="number"
          min={1}
          placeholder="e.g. 150"
          value={guests}
          onChange={(e) => { setGuests(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            height: 70,
            borderRadius: 10,
            border: '1px solid #DFDFDF',
            padding: '0 20px',
            fontSize: 32,
            fontWeight: 800,
            color: '#105778',
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ textAlign: 'center', color: '#E0232C', fontSize: 13, marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      {/* ── Quick-pick chips ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
        {GUEST_PICKS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => { setGuests(String(n)); setError('') }}
            style={{
              padding: '6px 16px',
              borderRadius: 30,
              border: guests === String(n) ? '1px solid #E0232C' : '1px solid #D0D5DD',
              backgroundColor: guests === String(n) ? '#E0232C' : '#fff',
              color: guests === String(n) ? '#fff' : '#505458',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#797979', marginBottom: 0 }}>
        {subtitle}
      </p>

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!isValid} />

    </QuoteStepLayout>
  )
}
