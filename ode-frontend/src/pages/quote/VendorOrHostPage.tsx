import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout from './QuoteStepLayout'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorOrHostPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)
  const reset     = useQuoteStore((s) => s.reset)

  // Guard: must have an event type selected
  useEffect(() => {
    if (!params.eventType) navigate('/onedayevent', { replace: true })
  }, [params.eventType, navigate])

  const handleHost = () => {
    // Reset wizard and go back to step 1 — they're a HOST, not a vendor
    reset()
    navigate('/onedayevent', { replace: true })
  }

  const handleVendor = () => {
    setParams({ isVendor: true })
    navigate('/quote/dates')
  }

  if (!params.eventType) return null

  return (
    <QuoteStepLayout
      step={2}
      title="Are you the host of the event, or a vendor at the event?"
      image="/assets/images/quote-type.png"
      backTo="/onedayevent"
    >

      {/* ── Two big buttons ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>

        {/* Host card */}
        <button
          type="button"
          onClick={handleHost}
          style={{
            flex: 1,
            borderRadius: 14,
            border: '1px solid #105778',
            backgroundColor: '#fff',
            padding: '28px 16px 20px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#1CA0DF'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(28,160,221,0.15)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#105778'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(28,160,221,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="32" height="32" fill="none" stroke="#1CA0DF" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#262D45', marginBottom: 6 }}>Host</p>
          <p style={{ fontSize: 13, color: '#797979', lineHeight: '18px' }}>
            I'm organizing the event and need general liability coverage
          </p>
        </button>

        {/* Vendor card */}
        <button
          type="button"
          onClick={handleVendor}
          style={{
            flex: 1,
            borderRadius: 14,
            border: '2px solid #E0232C',
            backgroundColor: '#fff',
            padding: '28px 16px 20px',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(224,35,44,0.15)',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(224,35,44,0.25)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(224,35,44,0.15)'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(224,35,44,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <svg width="32" height="32" fill="none" stroke="#E0232C" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#E0232C', marginBottom: 6 }}>Vendor</p>
          <p style={{ fontSize: 13, color: '#797979', lineHeight: '18px' }}>
            I'm a vendor or exhibitor providing services at someone else's event
          </p>
        </button>

      </div>

    </QuoteStepLayout>
  )
}
