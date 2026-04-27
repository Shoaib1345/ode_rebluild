import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}/${day}/${d.getFullYear()}`
}

function toInputVal(s: string): string {
  if (!s) return ''
  const [m, d, y] = s.split('/')
  if (!m || !d || !y) return ''
  return `${y}-${m}-${d}`
}

function fromInputVal(s: string): string {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  if (!y || !m || !d) return ''
  return `${m}/${d}/${y}`
}

const today    = formatDate(new Date())
const tomorrow = formatDate(new Date(Date.now() + 86_400_000))

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteDatesPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  useEffect(() => {
    if (!params.eventType) navigate('/onedayevent', { replace: true })
  }, [params.eventType, navigate])

  const existingDates = params.eventDates
    ? params.eventDates.split(',').map((d) => d.trim())
    : []

  const detectMode = (): 'today' | 'tomorrow' | 'other' => {
    if (!existingDates.length) return 'other'
    if (existingDates[0] === today)    return 'today'
    if (existingDates[0] === tomorrow) return 'tomorrow'
    return 'other'
  }

  const [mode,  setMode]  = useState<'today' | 'tomorrow' | 'other'>(detectMode)
  const [dates, setDates] = useState<string[]>(
    existingDates.length > 0 ? existingDates : ['']
  )

  const eventName = (params.eventTypeName ?? 'event').toLowerCase()
  const isVendor  = !!params.isVendor
  const nextRoute = isVendor ? '/quote/vendor-activity' : '/quote/location'

  // Auto-advance for Today / Tomorrow (mirrors ode_new handleEventDate → handleSubmit)
  const handleModeSelect = (m: 'today' | 'tomorrow' | 'other') => {
    setMode(m)
    if (m === 'today') {
      setDates([today])
      setParams({ eventDates: today })
      navigate(nextRoute)
    } else if (m === 'tomorrow') {
      setDates([tomorrow])
      setParams({ eventDates: tomorrow })
      navigate(nextRoute)
    } else {
      setDates([''])
    }
  }

  const handleDateChange = (idx: number, val: string) => {
    setDates((prev) => prev.map((d, i) => (i === idx ? fromInputVal(val) : d)))
  }

  const addDate    = () => { if (dates.length < 4) setDates((d) => [...d, '']) }
  const removeDate = (idx: number) => setDates((d) => d.filter((_, i) => i !== idx))

  const isValid = dates.length > 0 && dates.every((d) => d.length === 10)

  const handleNext = () => {
    if (!isValid) return
    setParams({ eventDates: dates.join(',') })
    navigate(nextRoute)
  }

  if (!params.eventType) return null

  const minDate = new Date().toISOString().split('T')[0]

  // ── Button style (mirrors ode_new ul.type li a) ────────────────────────────
  const optBtn = (id: 'today' | 'tomorrow' | 'other') => ({
    display:         'block' as const,
    width:           'calc((100% - 20px) / 3)',
    lineHeight:      '54px',
    fontSize:        16,
    fontWeight:      600 as const,
    textAlign:       'center' as const,
    borderRadius:    10,
    border:          mode === id ? '1px solid #E0232C' : '1px solid #105778',
    backgroundColor: mode === id ? '#E0232C' : '#fff',
    color:           mode === id ? '#fff' : '#262D45',
    cursor:          'pointer' as const,
    transition:      'background-color 0.15s, color 0.15s, border-color 0.15s',
    flexShrink:      0 as const,
  })

  return (
    <QuoteStepLayout
      step={2}
      title={`When is your ${eventName === 'vendor at event' ? 'event' : eventName} ?`}
      image="/assets/images/quote-event.png"
      backTo={isVendor ? '/quote/vendor-or-host' : '/onedayevent'}
    >

      {/* ── Today | Tomorrow | Other — all in one row ─────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <button type="button" onClick={() => handleModeSelect('today')}    style={optBtn('today')}>Today</button>
        <button type="button" onClick={() => handleModeSelect('tomorrow')} style={optBtn('tomorrow')}>Tomorrow</button>
        <button type="button" onClick={() => handleModeSelect('other')}    style={optBtn('other')}>Other</button>
      </div>

      {/* ── Date inputs (shown when Other selected) ────────────────────────── */}
      {mode === 'other' && (
        <div style={{ marginBottom: 16 }}>
          {dates.map((date, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <input
                type="date"
                value={toInputVal(date)}
                onChange={(e) => handleDateChange(i, e.target.value)}
                min={minDate}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 8,
                  border: '1px solid #DFDFDF',
                  padding: '0 14px',
                  fontSize: 14,
                  color: date ? '#262D45' : '#9CA3AF',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
                  background: '#fff',
                }}
              />
              {dates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDate(i)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: '1px solid #E3E3E3',
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#9CA3AF',
                    fontSize: 16,
                    lineHeight: '28px',
                    textAlign: 'center' as const,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* "To add more dates Click here" */}
          {dates.length < 4 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: '#262D45', fontWeight: 700, marginTop: 6 }}>
              To add more dates{' '}
              <button
                type="button"
                onClick={addDate}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1CA0DF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Click here
              </button>
            </p>
          )}

          {/* Next button — only shown for Other mode */}
          <QuoteNextBtn onClick={handleNext} disabled={!isValid} />
        </div>
      )}

    </QuoteStepLayout>
  )
}
