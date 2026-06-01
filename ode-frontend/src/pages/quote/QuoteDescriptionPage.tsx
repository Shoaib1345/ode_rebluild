import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import { shouldManualQuote } from '../../lib/manualQuote'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteDescriptionPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  useEffect(() => {
    if (!params.number_of_persons) navigate('/quote/guests', { replace: true })
  }, [params.number_of_persons, navigate])

  const [eventName,    setEventName]    = useState<string>((params.event_name    as string) ?? '')
  const [description,  setDescription]  = useState<string>((params.event_description as string) ?? '')

  const handleNext = () => {
    const next = { ...params, event_name: eventName, event_description: description }
    setParams({ event_name: eventName, event_description: description })
    // Higher-risk events skip online plans and go to manual underwriting.
    navigate(shouldManualQuote(next) ? '/quote/manual-review' : '/quote/plans')
  }

  if (!params.number_of_persons) return null

  return (
    <QuoteStepLayout
      step={8}
      title="Please provide a description of the event"
      image="/assets/images/event-description.png"
      backTo="/quote/addons"
    >

      {/* ── Event Name (optional) ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Event Name (optional)"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 10,
            border: '1px solid #DFDFDF',
            padding: '0 16px',
            fontSize: 14,
            color: '#262D45',
            outline: 'none',
            boxSizing: 'border-box' as const,
            background: '#fff',
          }}
        />
      </div>

      {/* ── Description textarea ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          placeholder="Enter details here"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            borderRadius: 10,
            border: '1px solid #DFDFDF',
            padding: '12px 16px',
            fontSize: 14,
            color: '#262D45',
            outline: 'none',
            boxSizing: 'border-box' as const,
            background: '#fff',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* ── Next (always active — both fields optional) ──────────────────── */}
      <QuoteNextBtn onClick={handleNext} />

    </QuoteStepLayout>
  )
}
