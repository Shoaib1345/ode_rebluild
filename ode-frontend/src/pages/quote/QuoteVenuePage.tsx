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

function FieldWrap({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#E0232C' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuoteVenuePage() {
  const navigate        = useNavigate()
  const selectedPlan    = useQuoteStore((s) => s.selectedPlan)
  const params          = useQuoteStore((s) => s.params)
  const customerInfo    = useQuoteStore((s) => s.customerInfo)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  // Required venue fields — pre-fill from store if back-navigating, or from wizard params
  const [eventName,    setEventName]    = useState(String(customerInfo.event_name    ?? params.event_name    ?? ''))
  const [venueName,    setVenueName]    = useState(String(customerInfo.venue_name    ?? ''))
  const [venueAddress, setVenueAddress] = useState(String(customerInfo.venue_address ?? ''))
  const [venueCity,    setVenueCity]    = useState(String(customerInfo.venue_city    ?? ''))
  // Pre-fill venue state from the quote's event state
  const [venueState,   setVenueState]   = useState(String(customerInfo.venue_state   ?? params.event_state  ?? ''))
  const [venueZip,     setVenueZip]     = useState(String(customerInfo.venue_zip     ?? ''))

  // Optional venue contact fields
  const [contactPerson, setContactPerson] = useState(String(customerInfo.venue_contact_person ?? ''))
  const [contactNumber, setContactNumber] = useState(String(customerInfo.venue_contact_number ?? ''))
  const [contactEmail,  setContactEmail]  = useState(String(customerInfo.venue_contact_email  ?? ''))

  const isValid = !!(eventName && venueName && venueAddress && venueCity && venueState && venueZip)

  const handleNext = () => {
    setCustomerInfo({
      event_name:           eventName,
      venue_name:           venueName,
      venue_address:        venueAddress,
      venue_city:           venueCity,
      venue_state:          venueState,
      venue_zip:            venueZip,
      venue_contact_person: contactPerson,
      venue_contact_number: contactNumber,
      venue_contact_email:  contactEmail,
    })
    navigate('/quote/payment')
  }

  if (!selectedPlan) return null

  return (
    <QuoteStepLayout
      step={10}
      checkoutStep={2}
      title="What is the name & address of the venue?"
      backTo="/quote/insured"
    >

      {/* ── Event Name / Venue Name ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <FieldWrap label="Event Name" required>
          <input
            type="text"
            placeholder="Jane's Birthday Party"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap label="Venue Name" required>
          <input
            type="text"
            placeholder="The Grand Ballroom"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

      {/* ── Street Address ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <FieldWrap label="Street Address" required>
          <input
            type="text"
            placeholder="456 Venue Ave"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

      {/* ── City / State / Zip ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: 12, marginBottom: 20 }}>
        <FieldWrap label="City" required>
          <input
            type="text"
            placeholder="Los Angeles"
            value={venueCity}
            onChange={(e) => setVenueCity(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
        <FieldWrap label="State" required>
          <div style={{ position: 'relative' }}>
            <select
              value={venueState}
              onChange={(e) => setVenueState(e.target.value)}
              style={{
                ...inputStyle,
                color: venueState ? '#262D45' : '#9CA3AF',
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
        <FieldWrap label="Zip" required>
          <input
            type="text"
            placeholder="90210"
            value={venueZip}
            onChange={(e) => setVenueZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            style={inputStyle}
            maxLength={5}
          />
        </FieldWrap>
      </div>

      {/* ── Optional venue contact ─────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #E3E3E3',
          paddingTop: 18,
          marginBottom: 6,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1CA0DF',
            marginBottom: 14,
            lineHeight: '20px',
          }}
        >
          If you provide us the information of your contact at the venue, we send them your Certificate directly!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FieldWrap label="Venue Contact Name">
            <input
              type="text"
              placeholder="Optional"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              style={inputStyle}
            />
          </FieldWrap>
          <FieldWrap label="Venue Contact Phone">
            <input
              type="tel"
              placeholder="Optional"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              style={inputStyle}
            />
          </FieldWrap>
        </div>

        <FieldWrap label="Venue Contact Email">
          <input
            type="email"
            placeholder="Optional"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={inputStyle}
          />
        </FieldWrap>
      </div>

      {/* ── Next ─────────────────────────────────────────────────────────── */}
      <QuoteNextBtn onClick={handleNext} disabled={!isValid} />

    </QuoteStepLayout>
  )
}
