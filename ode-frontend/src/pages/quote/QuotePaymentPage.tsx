import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      lineHeight: '22px',
      color: '#262D45',
      fontFamily: 'inherit',
      '::placeholder': { color: '#BBBBBB' },
    },
    invalid: { color: '#E0232C' },
  },
}

// ─── Shared field styles ──────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 46,
  borderRadius: 6,
  border: '1px solid #D0D5DD',
  padding: '0 12px',
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
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

// Wrapper that lets a Stripe iframe render properly —
// use padding only, never height + flex on the direct parent of a Stripe element
const stripeBox: React.CSSProperties = {
  border: '1px solid #D0D5DD',
  borderRadius: 6,
  background: '#fff',
  padding: '12px',
  boxSizing: 'border-box',
  width: '100%',
}

// ─── Standalone page layout ───────────────────────────────────────────────────
// A plain layout with no z-index layers or wave footer so that Stripe iframes
// can receive pointer events without any CSS interference.

const CHECKOUT_LABELS = ['Insured Info', 'Venue Details', 'Contact & Pay']

function PaymentPageShell({ backTo, children }: { backTo: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: 65,
          marginTop: 26,
          marginBottom: 26,
        }}
      >
        {/* Left: back arrow + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Go back"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1px solid #E3E3E3', background: '#fff',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#555" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link to="/">
            <img src="/assets/images/logo-img.svg" alt="One Day Event" style={{ height: 62, width: 'auto' }} />
          </Link>
        </div>

        {/* Right: Save Quote + Phone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            style={{
              lineHeight: '36px', padding: '0 18px', borderRadius: 40,
              border: 'none', background: '#1CA0DF', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Save Quote
          </button>
          <a
            href="tel:8886390093"
            style={{
              lineHeight: '36px', padding: '0 14px', borderRadius: 40,
              border: '1px solid #CCCCCC', color: '#555',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Phone
          </a>
        </div>
      </header>

      {/* ── 3-step checkout progress bar ────────────────────────────────── */}
      <div style={{ padding: '0 32px', marginBottom: 44 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {CHECKOUT_LABELS.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: 8, borderRadius: 40, background: '#1087c3',
                  opacity: 1,          // step 3 = all filled
                  marginBottom: 6,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#105778' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 60px', boxSizing: 'border-box' }}>
        {children}
      </div>

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

  // Pre-fill from insured info when available
  const [firstName,      setFirstName]      = useState(String(customerInfo.first_name      ?? customerInfo.ins_first_name ?? ''))
  const [lastName,       setLastName]       = useState(String(customerInfo.last_name       ?? customerInfo.ins_last_name  ?? ''))
  const [email,          setEmail]          = useState(String(customerInfo.email           ?? ''))
  const [phone,          setPhone]          = useState(String(customerInfo.phone           ?? ''))
  const [billingAddress, setBillingAddress] = useState(String(customerInfo.billing_address ?? customerInfo.ins_street    ?? ''))
  const [billingCity,    setBillingCity]    = useState(String(customerInfo.billing_city    ?? customerInfo.ins_city      ?? ''))
  const [billingState,   setBillingState]   = useState(String(customerInfo.billing_state   ?? customerInfo.ins_state     ?? params.event_state ?? ''))
  const [billingZip,     setBillingZip]     = useState(String(customerInfo.billing_zip     ?? customerInfo.ins_zip       ?? ''))

  const [agreed,        setAgreed]        = useState(false)
  const [termsExpanded, setTermsExpanded] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [submitting,    setSubmitting]    = useState(false)

  if (!selectedPlan) return null

  const premium   = selectedPlan.premium
  const brokerFee = selectedPlan.broker_fee
  const total     = selectedPlan.total + (selectedPlan.extra_charge ?? 0)
  const canSubmit = agreed && !submitting && !!stripe && !!elements

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
          email: email          || undefined,
          phone: phone          || undefined,
          address: {
            line1:       billingAddress || undefined,
            city:        billingCity    || undefined,
            state:       billingState   || undefined,
            postal_code: billingZip     || undefined,
            country:     'US',
          },
        },
      })

      if (stripeErr) { setError(stripeErr.message ?? 'Card error.'); return }

      setCustomerInfo({ first_name: firstName, last_name: lastName, email, phone })

      const payload = {
        rate_id: selectedPlan.rate_id,         carrier: selectedPlan.carrier,
        premium: selectedPlan.premium,         broker_fee: selectedPlan.broker_fee,
        processing_fee: selectedPlan.processing_fee, extra_charge: selectedPlan.extra_charge ?? 0,
        total: selectedPlan.total,             min_limit: selectedPlan.min_limit,
        max_limit: selectedPlan.max_limit,
        event_type_id: params.eventType,       event_type_name: params.eventTypeName,
        event_dates: params.eventDates,        event_state: params.event_state,
        persons: params.number_of_persons,
        noha: params.noha ?? 0,                w_o_s: params.w_o_s ?? 0,
        p_a_n_c_b: params.p_a_n_c_b ?? 0,     host_liquor: params.host_liquor ?? 0,
        liquor: params.liquor ?? 0,            additional_insureds: params.additional_insureds ?? 0,
        additional_insured_details: params.additional_insured_details ?? [],
        private_residence: params.privateResidence ?? 0, is_venue: params.isSetVenue ?? 0,
        timezone: params.timezone ?? '',
        first_name: firstName,   last_name: lastName,   email,   phone,
        billing_address: billingAddress, billing_city: billingCity,
        billing_state: billingState,     billing_zip: billingZip,
        ...customerInfo,
        stripe_payment_method_id: paymentMethod!.id,
      }

      const res = await api.post<{ lead_number: number }>('/leads', payload)
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

  // Policy detail rows from selected plan
  const policyRows: { label: string; value: string }[] = [
    ...(selectedPlan.limits.length > 0
      ? [{ label: 'LIMITS', value: `$${selectedPlan.min_limit} million per occurrence / $${selectedPlan.max_limit} million aggregate` }]
      : []),
    ...selectedPlan.limits.map((l) => ({ label: l.gl_limit_type.toUpperCase(), value: l.gl_limit })),
    { label: 'GUESTS',              value: String(params.number_of_persons  ?? 0) },
    { label: 'ADDITIONAL INSUREDS', value: String(params.additional_insureds ?? 0) },
  ]

  return (
    <PaymentPageShell backTo="/quote/venue">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>

        {/* ══ LEFT: form ══════════════════════════════════════════════════ */}
        <div>
          <form onSubmit={handleSubmit} noValidate>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#262D45', marginBottom: 20 }}>
              Payment Information
            </h2>

            {/* First / Last */}
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

            {/* Email / Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelSt}>Email</label>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Phone</label>
                <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputSt} />
              </div>
            </div>

            {/* Card Number */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Credit Card Number</label>
              <div style={stripeBox}>
                <CardNumberElement options={{ ...STRIPE_STYLE, showIcon: true }} />
              </div>
            </div>

            {/* Exp Mon | Exp Yea | CVC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={labelSt}>Exp Mon / Exp Yea</label>
                <div style={stripeBox}>
                  <CardExpiryElement options={STRIPE_STYLE} />
                </div>
              </div>
              <div>
                <label style={labelSt}>CVC</label>
                <div style={stripeBox}>
                  <CardCvcElement options={STRIPE_STYLE} />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Billing Address</label>
              <input type="text" placeholder="Billing Address" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} style={inputSt} />
            </div>

            {/* City / State */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelSt}>City</label>
                <input type="text" placeholder="City" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Select State</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                    style={{ ...inputSt, color: billingState ? '#262D45' : '#9CA3AF', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: 34 }}
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="14" height="14" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Zip */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelSt}>Zip</label>
              <input
                type="text" placeholder="Zip" value={billingZip}
                onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5} style={{ ...inputSt, width: '50%' }}
              />
            </div>

            {/* Terms checkbox */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#505458', lineHeight: '20px' }}>
                I agree to the{' '}
                <a
                  href="#terms-section"
                  onClick={(e) => { e.preventDefault(); document.getElementById('terms-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ color: '#1CA0DF', textDecoration: 'underline' }}
                >
                  terms and conditions
                </a>
                {' '}below
              </span>
            </label>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#B91C1C' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                width: '100%', height: 48, borderRadius: 6, border: 'none',
                background: canSubmit ? '#1CA0DF' : '#D5D9E6',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
              }}
            >
              {submitting ? 'Processing…' : 'Submit'}
            </button>

          </form>

          {/* Terms & Conditions */}
          <div id="terms-section" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E3E3E3' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#262D45', marginBottom: 10 }}>Terms and Conditions</h3>
            <p style={{ fontSize: 12, color: '#505458', lineHeight: '20px' }}>
              {termsExpanded ? TERMS_TEXT : TERMS_TEXT.slice(0, 240) + '…'}
              {' '}
              <button
                type="button"
                onClick={() => setTermsExpanded((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#1CA0DF', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              >
                {termsExpanded ? 'Read less' : 'Read more'}
              </button>
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Price + Policy Details ═══════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Price card */}
          <div style={{ background: '#fff', border: '1px solid #E3E3E3', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#F7F8FA', padding: '10px 16px', borderBottom: '1px solid #E3E3E3' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#262D45' }}>Price</span>
            </div>
            <div>
              {[
                { label: 'PREMIUM',    value: String(premium)  },
                { label: 'BROKER FEE', value: String(brokerFee) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #F0F0F0' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#262D45' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.6px' }}>TOTAL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#262D45' }}>{Math.round(total)}</span>
                  <span style={{ background: '#1CA0DF', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Details card */}
          <div style={{ background: '#fff', border: '1px solid #E3E3E3', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#F7F8FA', padding: '10px 16px', borderBottom: '1px solid #E3E3E3' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#262D45' }}>Policy Details</span>
            </div>
            <div>
              {policyRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: 8, padding: '7px 16px',
                    borderBottom: i < policyRows.length - 1 ? '1px solid #F0F0F0' : 'none',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#797979', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: row.label === 'LIMITS' ? '#1CA0DF' : '#262D45', textAlign: 'right' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PaymentPageShell>
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
