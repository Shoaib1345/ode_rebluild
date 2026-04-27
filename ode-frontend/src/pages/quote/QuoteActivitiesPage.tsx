import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteActivitiesPage() {
  const navigate  = useNavigate()
  const params    = useQuoteStore((s) => s.params)
  const setParams = useQuoteStore((s) => s.setParams)

  const isVendor = !!params.isVendor

  useEffect(() => {
    // Vendors skip activities entirely — go straight to addons
    if (isVendor) { navigate('/quote/addons', { replace: true }); return }
    if (!params.number_of_persons) navigate('/quote/guests', { replace: true })
  }, [isVendor, params.number_of_persons, navigate])

  const [activities, setActivities] = useState<'Yes' | 'No' | ''>(
    (params.special_activities as 'Yes' | 'No') ?? ''
  )
  const [detail, setDetail] = useState<string>(
    (params.event_special_act_detail as string) ?? ''
  )
  const [error, setError] = useState('')

  const isValid =
    activities !== '' &&
    (activities !== 'Yes' || detail.trim() !== '')

  const advance = (act: 'Yes' | 'No', det: string) => {
    setParams({ special_activities: act, event_special_act_detail: det })
    navigate('/quote/addons')
  }

  const handleSelect = (val: 'Yes' | 'No') => {
    setActivities(val)
    setError('')
    if (val === 'No') advance('No', '')
  }

  const handleNext = () => {
    if (!isValid) { setError('Please describe the special activities.'); return }
    advance(activities as 'Yes' | 'No', detail)
  }

  if (isVendor || !params.number_of_persons) return null

  return (
    <QuoteStepLayout
      step={6}
      title="Will your event include"
      image="/assets/images/quote-include.png"
      imageLarge
      backTo="/quote/guests"
    >

      {/* ── Activity list ─────────────────────────────────────────────────── */}
      <p
        style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#797979',
          lineHeight: '20px',
          marginBottom: 24,
        }}
      >
        Stunts, Pyrotechnics, Aircrafts, Animals, Camping/Overnight Stays, Car Races,
        Precision Driving, Mechanical Devices, Rap/Hip-Hop, Rock/Metal, Rides,
        Water Activities, Bounce Houses or Inflatables
      </p>

      {/* ── Yes / No ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {(['Yes', 'No'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => handleSelect(opt)}
            style={{
              flex: 1,
              lineHeight: '54px',
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
              borderRadius: 10,
              border: activities === opt ? '1px solid #E0232C' : '1px solid #105778',
              backgroundColor: activities === opt ? '#E0232C' : '#fff',
              color: activities === opt ? '#fff' : '#262D45',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* ── Detail input (when Yes) ──────────────────────────────────────── */}
      {activities === 'Yes' && (
        <div style={{ marginBottom: 16 }}>
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#262D45',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            What special activities will be at the event?
          </h4>
          <input
            type="text"
            placeholder=""
            value={detail}
            onChange={(e) => { setDetail(e.target.value); setError('') }}
            autoFocus
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
            }}
          />
          {error && (
            <p style={{ textAlign: 'center', color: '#E0232C', fontSize: 13, marginTop: 8 }}>
              {error}
            </p>
          )}

          <QuoteNextBtn onClick={handleNext} disabled={!isValid} />
        </div>
      )}

    </QuoteStepLayout>
  )
}
