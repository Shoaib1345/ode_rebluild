import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import { manualQuoteReasons } from '../../lib/manualQuote'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 50,
  borderRadius: 10,
  border: '1px solid #DFDFDF',
  padding: '0 16px',
  fontSize: 14,
  color: '#262D45',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#697386',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

export default function QuoteManualReviewPage() {
  const navigate        = useNavigate()
  const params          = useQuoteStore((s) => s.params)
  const customerInfo    = useQuoteStore((s) => s.customerInfo)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)

  const reasons = manualQuoteReasons(params)

  // Guard: must have a quote in progress, and must actually qualify for review.
  useEffect(() => {
    if (!params.eventType || !params.eventDates) {
      navigate('/onedayevent', { replace: true })
    } else if (reasons.length === 0) {
      navigate('/quote/plans', { replace: true })
    }
  }, [params.eventType, params.eventDates, reasons.length, navigate])

  const [firstName, setFirstName] = useState(String(customerInfo.first_name ?? ''))
  const [lastName,  setLastName]  = useState(String(customerInfo.last_name  ?? ''))
  const [email,     setEmail]     = useState(String(customerInfo.email      ?? ''))
  const [phone,     setPhone]     = useState(String(customerInfo.phone      ?? ''))

  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  const canSubmit =
    firstName.trim() && lastName.trim() && /\S+@\S+\.\S+/.test(email) && phone.trim() && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      setCustomerInfo({ first_name: firstName, last_name: lastName, email, phone })

      await api.post('/leads/manual-quote', {
        event_type_id:        params.eventType,
        event_type_name:      params.eventTypeName,
        event_dates:          params.eventDates,
        event_state:          params.event_state,
        persons:              params.number_of_persons,
        noha:                 params.noha ? 1 : 0,
        w_o_s:                params.w_o_s ? 1 : 0,
        p_a_n_c_b:            params.p_a_n_c_b ? 1 : 0,
        host_liquor:          params.host_liquor ? 1 : 0,
        liquor:               params.liquor ? 1 : 0,
        additional_insureds:  params.additional_insureds ?? 0,
        private_residence:    params.privateResidence ? 1 : 0,
        timezone:             params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        event_name:           params.event_name,
        first_name:           firstName,
        last_name:            lastName,
        email,
        phone,
        manual_quote_reasons: reasons,
      })

      setSubmitted(true)
    } catch {
      toast.error('Something went wrong submitting your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!params.eventType || !params.eventDates || reasons.length === 0) return null

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <QuoteStepLayout step={9} title="Thanks — we're on it!">
        <p style={{ textAlign: 'center', color: '#505458', fontSize: 15, lineHeight: '24px', marginBottom: 24 }}>
          Your event needs a quick review by our underwriting team. We've saved your
          details and someone will reach out to <strong>{email}</strong> shortly with
          your custom quote. Thank you!
        </p>
        <QuoteNextBtn onClick={() => navigate('/')}>Done</QuoteNextBtn>
      </QuoteStepLayout>
    )
  }

  // ── Contact form ──────────────────────────────────────────────────────────
  return (
    <QuoteStepLayout
      step={9}
      title="Let's finish your quote with a quick review"
      subtitle="A few details about your event mean we'll tailor your quote by hand. Leave your contact info and our team will get right back to you."
      backTo="/quote/description"
    >
      {/* Why we're reviewing */}
      <div
        style={{
          background: '#F1F8FE',
          border: '1px solid #CDE7FA',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: '#1077B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Why a manual review?
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#505458', fontSize: 13, lineHeight: '22px' }}>
          {reasons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelSt}>First Name</label>
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Last Name</label>
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputSt} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelSt}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Phone</label>
          <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputSt} />
        </div>
      </div>

      <QuoteNextBtn onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? 'Submitting…' : 'Request my quote'}
      </QuoteNextBtn>
    </QuoteStepLayout>
  )
}
