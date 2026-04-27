import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteStepLayout from './QuoteStepLayout'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string)

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

// ─── Terms text ───────────────────────────────────────────────────────────────

const TERMS_TEXT =
  'By purchasing, I accept I have stated everything about the event to the best of ' +
  'my knowledge, and I authorize this charge to my credit card and this is my ' +
  'acceptance for the charge. If any of the information I provided is incorrect ' +
  'this policy may be voided and no coverage will be in effect. I further accept ' +
  'and acknowledge that I have read and understand the terms and conditions, and ' +
  'understand that there may be no refund or cancellation on this policy, even if ' +
  'my event is not held. Payment made does not mean coverage is issued, no coverage ' +
  'is final until the carrier has approved and issued the policy and confirmed the ' +
  'event details. If the insurance company declines or fails to underwrite the ' +
  'policy we will refund all premiums and no coverage is in force.'

// ─── Stripe element style ─────────────────────────────────────────────────────

const STRIPE_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#262D45',
      fontFamily: "'Nunito Sans', ui-sans-serif, sans-serif",
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#E0232C' },
  },
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 8,
  border: '1px solid #DFDFDF',
  padding: '0 14px',
  fontSize: 14,
  color: '#262D45',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#697386',
  marginBottom: 5,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.6px',
}

/** Wrapper that makes a Stripe element look like a regular input */
function StripeWrap({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: 46,
        borderRadius: 8,
        border: '1px solid #DFDFDF',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

// ─── Inner payment form ───────────────────────────────────────────────────────

function PaymentForm() {
  const navigate        = useNavigate()
  const stripe          = useStripe()
  const elements        = useElements()
  const params          = useQuoteStore((s) => s.params)
  const selectedPlan    = useQuoteStore((s) => s.selectedPlan)
  const customerInfo    = useQuoteStore((s) => s.customerInfo)
  const setCustomerInfo = useQuoteStore((s) => s.setCustomerInfo)
  const reset           = useQuoteStore((s) => s.reset)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  // ── Contact/billing fields — pre-fill from insured info when available ─────
  const [firstName,      setFirstName]      = useState(String(customerInfo.first_name      ?? customerInfo.ins_first_name ?? ''))
  const [lastName,       setLastName]       = useState(String(customerInfo.last_name       ?? customerInfo.ins_last_name  ?? ''))
  const [email,          setEmail]          = useState(String(customerInfo.email           ?? ''))
  const [phone,          setPhone]          = useState(String(customerInfo.phone           ?? ''))
  const [billingAddress, setBillingAddress] = useState(String(customerInfo.billing_address ?? customerInfo.ins_street    ?? ''))
  const [billingCity,    setBillingCity]    = useState(String(customerInfo.billing_city    ?? customerInfo.ins_city      ?? ''))
  const [billingState,   setBillingState]   = useState(String(customerInfo.billing_state   ?? customerInfo.ins_state     ?? params.event_state ?? ''))
  const [billingZip,     setBillingZip]     = useState(String(customerInfo.billing_zip     ?? customerInfo.ins_zip       ?? ''))

  const [agreed,         setAgreed]         = useState(false)
  const [termsExpanded,  setTermsExpanded]  = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [submitting,     setSubmitting]     = useState(false)

  if (!selectedPlan) return null

  const premium    = selectedPlan.premium
  const brokerFee  = selectedPlan.broker_fee
  const total      = selectedPlan.total + (selectedPlan.extra_charge ?? 0)
  const canSubmit  = agreed && !submitting && !!stripe && !!elements

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError(null)
    setSubmitting(true)

    try {
      const cardEl = elements!.getElement(CardNumberElement)
      if (!cardEl) throw new Error('Card element not found.')

      const { error: stripeErr, paymentMethod } = await stripe!.createPaymentMethod({
        type: 'card',
        card: cardEl,
        billing_details: {
          name:  `${firstName} ${lastName}`.trim(),
          email: email    || undefined,
          phone: phone    || undefined,
          address: {
            line1:       billingAddress || undefined,
            city:        billingCity    || undefined,
            state:       billingState   || undefined,
            postal_code: billingZip     || undefined,
            country:     'US',
          },
        },
      })

      if (stripeErr) {
        setError(stripeErr.message ?? 'Card error. Please try again.')
        return
      }

      // Persist contact info so it's available in the confirmation
      setCustomerInfo({ first_name: firstName, last_name: lastName, email, phone })

      const payload = {
        // Plan
        rate_id:        selectedPlan.rate_id,
        carrier:        selectedPlan.carrier,
        premium:        selectedPlan.premium,
        broker_fee:     selectedPlan.broker_fee,
        processing_fee: selectedPlan.processing_fee,
        extra_charge:   selectedPlan.extra_charge ?? 0,
        total:          selectedPlan.total,
        min_limit:      selectedPlan.min_limit,
        max_limit:      selectedPlan.max_limit,
        // Event params
        event_type_id:       params.eventType,
        event_type_name:     params.eventTypeName,
        event_dates:         params.eventDates,
        event_state:         params.event_state,
        persons:             params.number_of_persons,
        noha:                params.noha            ?? 0,
        w_o_s:               params.w_o_s           ?? 0,
        p_a_n_c_b:           params.p_a_n_c_b       ?? 0,
        host_liquor:         params.host_liquor      ?? 0,
        liquor:              params.liquor           ?? 0,
        additional_insureds: params.additional_insureds ?? 0,
        private_residence:   params.privateResidence  ?? 0,
        is_venue:            params.isSetVenue        ?? 0,
        timezone:            params.timezone          ?? '',
        // Contact & billing
        first_name:      firstName,
        last_name:       lastName,
        email,
        phone,
        billing_address: billingAddress,
        billing_city:    billingCity,
        billing_state:   billingState,
        billing_zip:     billingZip,
        // Previously saved (insured info + venue details)
        ...customerInfo,
        // Stripe
        stripe_payment_method_id: paymentMethod!.id,
      }

      const res = await api.post<{ lead_number: number; message: string }>('/leads', payload)
      reset()
      navigate(`/quote/confirmation/${res.data.lead_number}`, { replace: true })

    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'An unexpected error occurred. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Policy detail rows ─────────────────────────────────────────────────────
  const policyRows: { label: string; value: string }[] = [
    ...(selectedPlan.limits.length > 0
      ? [{ label: 'LIMITS', value: `$${selectedPlan.min_limit} million per occurrence / $${selectedPlan.max_limit} million aggregate` }]
      : []),
    ...selectedPlan.limits.map((l) => ({ label: l.gl_limit_type.toUpperCase(), value: l.gl_limit })),
    { label: 'GUESTS',              value: String(params.number_of_persons ?? 0) },
    { label: 'ADDITIONAL INSUREDS', value: String(params.additional_insureds ?? 0) },
  ]

  return (
    <QuoteStepLayout
      step={10}
      checkoutStep={3}
      wide
      backTo="/quote/venue"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 28,
          alignItems: 'start',
        }}
      >

        {/* ══ LEFT: payment form + T&C ══════════════════════════════════════ */}
        <div>
          <form onSubmit={handleSubmit} noValidate>

            {/* ── Title ─────────────────────────────────────────────────── */}
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#262D45',
                marginBottom: 20,
              }}
            >
              Payment Information
            </h2>

            {/* ── First / Last name ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── Email / Phone ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ── Card Number ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Credit Card Number</label>
              <StripeWrap>
                <CardNumberElement options={STRIPE_STYLE} />
              </StripeWrap>
            </div>

            {/* ── Expiry / CVC ──────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={labelStyle}>Exp. Date (MM / YY)</label>
                <StripeWrap>
                  <CardExpiryElement options={STRIPE_STYLE} />
                </StripeWrap>
              </div>
              <div>
                <label style={labelStyle}>CVC</label>
                <StripeWrap>
                  <CardCvcElement options={STRIPE_STYLE} />
                </StripeWrap>
              </div>
            </div>

            {/* ── Billing Address ───────────────────────────────────────── */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Billing Address</label>
              <input
                type="text"
                placeholder="Billing Address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* ── City / State ──────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Select State</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    style={{
                      ...inputStyle,
                      color: billingState ? '#262D45' : '#9CA3AF',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer',
                      paddingRight: 34,
                    }}
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Zip ───────────────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Zip</label>
              <input
                type="text"
                placeholder="Zip"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                style={{ ...inputStyle, width: '50%' }}
              />
            </div>

            {/* ── Terms checkbox ────────────────────────────────────────── */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 18,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#505458', lineHeight: '20px' }}>
                I agree to the terms and conditions below
              </span>
            </label>

            {/* ── Error ─────────────────────────────────────────────────── */}
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#B91C1C',
                  lineHeight: '20px',
                }}
              >
                {error}
              </div>
            )}

            {/* ── Submit ────────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 8,
                border: 'none',
                background: canSubmit ? '#1CA0DF' : '#D5D9E6',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                letterSpacing: '0.3px',
              }}
            >
              {submitting ? 'Processing…' : 'Submit'}
            </button>

          </form>

          {/* ── Terms & Conditions text ──────────────────────────────────── */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E3E3E3' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 10 }}>
              Terms and Conditions
            </h3>
            <p style={{ fontSize: 12, color: '#505458', lineHeight: '20px' }}>
              {termsExpanded ? TERMS_TEXT : TERMS_TEXT.slice(0, 220) + '…'}
              {' '}
              <button
                type="button"
                onClick={() => setTermsExpanded((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#1CA0DF',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {termsExpanded ? 'Read less' : 'Read more'}
              </button>
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Price + Policy Details ═════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Price card ────────────────────────────────────────────────── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E3E3E3',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ background: '#F7F8FA', padding: '10px 16px', borderBottom: '1px solid #E3E3E3' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#262D45' }}>Price</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {/* Premium */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  PREMIUM
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#262D45' }}>{premium}</span>
              </div>
              {/* Broker fee */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderBottom: '1px solid #F0F0F0',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  BROKER FEE
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#262D45' }}>{brokerFee}</span>
              </div>
              {/* Total */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  TOTAL
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#262D45' }}>
                    {Math.round(total)}
                  </span>
                  <span
                    style={{
                      background: '#1CA0DF',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.4px',
                    }}
                  >
                    USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Policy Details card ───────────────────────────────────────── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E3E3E3',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div style={{ background: '#F7F8FA', padding: '10px 16px', borderBottom: '1px solid #E3E3E3' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#262D45' }}>Policy Details</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {policyRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 16px',
                    borderBottom: i < policyRows.length - 1 ? '1px solid #F0F0F0' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#797979',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: row.label === 'LIMITS' ? '#1CA0DF' : '#262D45',
                      textAlign: 'right',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </QuoteStepLayout>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function QuotePaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  )
}
