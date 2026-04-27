import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout, { QuoteNextBtn } from './QuoteStepLayout'

// ─── US states ────────────────────────────────────────────────────────────────

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

// ─── Shared field helpers ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#262D45',
  marginBottom: 6,
}

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label} <span style={{ color: '#E0232C' }}>*</span>
      </label>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteInsuredPage() {
  const navigate        = useNavigate()
  const selectedPlan    = useQuoteStore((s) => s.selectedPlan)
  const customerInfo    = useQuoteStore((s) => s.customerInfo)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  // Restore from store if the user navigates back
  const [firstName, setFirstName] = useState(String(customerInfo.ins_first_name ?? ''))
  const [lastName,  setLastName]  = useState(String(customerInfo.ins_last_name  ?? ''))
  const [street,    setStreet]    = useState(String(customerInfo.ins_street     ?? ''))
  const [city,      setCity]      = useState(String(customerInfo.ins_city       ?? ''))
  const [state,     setState]     = useState(String(customerInfo.ins_state      ?? ''))
  const [zip,       setZip]       = useState(String(customerInfo.ins_zip        ?? ''))

  const isValid = !!(firstName && lastName && street && city && state && zip)

  const handleNext = () => {
    setCustomerInfo({
      ins_first_name: firstName,
      ins_last_name:  lastName,
      ins_street:     street,
      ins_city:       city,
      ins_state:      state,
      ins_zip:        zip,
    })
    navigate('/quote/venue')
  }

  if (!selectedPlan) return null

  return (
    <QuoteStepLayout
      step={9}
      checkoutStep={1}
      title="What is the name & address of the insured?"
      subtitle="This is the person or organization that needs to be insured, usually the host of the event."
      backTo="/quote/plans"
    >

      {/* ── First Name / Last Name ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <FieldWrap label="First Name">
          <input
            type="text"
            placeholder="Jane"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap label="Last Name">
          <input
            type="text"
            placeholder="Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

      {/* ── Street Address ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <FieldWrap label="Street Address">
          <input
            type="text"
            placeholder="123 Main St"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

      {/* ── City / State / Zip ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: 12, marginBottom: 14 }}>
        <FieldWrap label="City">
          <input
            type="text"
            placeholder="Los Angeles"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap label="State">
          <div style={{ position: 'relative' }}>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{
                ...inputStyle,
                color: state ? '#262D45' : '#9CA3AF',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
                paddingRight: 36,
              }}
            >
              <option value="">State…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </FieldWrap>
        <FieldWrap label="Zip">
          <input
            type="text"
            placeholder="90210"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            style={inputStyle}
            maxLength={5}
          />
        </FieldWrap>
      </div>

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!isValid} />

    </QuoteStepLayout>
  )
}
