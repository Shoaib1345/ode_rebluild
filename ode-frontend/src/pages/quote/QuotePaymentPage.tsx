import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'
import QuoteLayout from './QuoteLayout'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string)

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#262D45',
      fontFamily: "'Nunito Sans', ui-sans-serif, sans-serif",
      '::placeholder': { color: '#9ca3af' },
      lineHeight: '1.5',
    },
    invalid: { color: '#E0232C' },
  },
}

// ─── Inner form ───────────────────────────────────────────────────────────────

function PaymentForm() {
  const navigate     = useNavigate()
  const stripe       = useStripe()
  const elements     = useElements()

  const params       = useQuoteStore((s) => s.params)
  const selectedPlan = useQuoteStore((s) => s.selectedPlan)
  const customerInfo = useQuoteStore((s) => s.customerInfo)
  const reset        = useQuoteStore((s) => s.reset)

  const [error,      setError]      = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!selectedPlan) navigate('/quote/plans', { replace: true })
  }, [selectedPlan, navigate])

  if (!selectedPlan) return null

  const total = (selectedPlan.total + (selectedPlan.extra_charge ?? 0)).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setError(null)
    setSubmitting(true)

    try {
      const cardEl = elements.getElement(CardElement)
      if (!cardEl) throw new Error('Card element not found.')

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardEl,
        billing_details: {
          name:  `${customerInfo.ins_first_name ?? ''} ${customerInfo.ins_last_name ?? ''}`.trim(),
          email: (customerInfo.email as string) ?? undefined,
          phone: (customerInfo.phone as string) ?? undefined,
          address: {
            line1:       (customerInfo.ins_street  as string) ?? undefined,
            city:        (customerInfo.ins_city    as string) ?? undefined,
            state:       (customerInfo.ins_state   as string) ?? undefined,
            postal_code: (customerInfo.ins_zip     as string) ?? undefined,
            country:     'US',
          },
        },
      })

      if (stripeError) {
        setError(stripeError.message ?? 'Card error. Please try again.')
        return
      }

      const payload = {
        rate_id:        selectedPlan.rate_id,
        carrier:        selectedPlan.carrier,
        premium:        selectedPlan.premium,
        broker_fee:     selectedPlan.broker_fee,
        processing_fee: selectedPlan.processing_fee,
        extra_charge:   selectedPlan.extra_charge ?? 0,
        total:          selectedPlan.total,
        min_limit:      selectedPlan.min_limit,
        max_limit:      selectedPlan.max_limit,
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
        ...customerInfo,
        stripe_payment_method_id: paymentMethod!.id,
      }

      const res = await api.post<{ lead_number: number; message: string }>('/leads', payload)
      reset()
      navigate(`/quote/confirmation/${res.data.lead_number}`, { replace: true })

    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'An unexpected error occurred. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <QuoteLayout step={10}>

      {/* ── Back ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/quote/info')}
          className="inline-flex items-center gap-1 text-sm text-[#1CA0DF] hover:text-[#105778] font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Your Info
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Order summary ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(55,106,136,0.10)] overflow-hidden sticky top-6">

            {/* Header */}
            <div className="bg-[#105778] px-5 py-4">
              <h2 className="text-sm font-bold text-white">Order Summary</h2>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Event info */}
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Event type', value: params.eventTypeName },
                  { label: 'State',      value: params.event_state },
                  { label: 'Date',       value: params.eventDates?.split(',')[0] },
                  { label: 'Guests',     value: params.number_of_persons ? `${params.number_of_persons}` : undefined },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <span className="text-[#797979]">{row.label}</span>
                    <span className="font-semibold text-[#262D45] text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E3E3E3]" />

              {/* Coverage */}
              <div className="bg-[#EDF0FA] rounded-xl p-3.5">
                <p className="text-xs font-bold text-[#105778] uppercase tracking-wide mb-2">Coverage</p>
                <p className="text-base font-extrabold text-[#262D45]">
                  ${selectedPlan.min_limit}M / ${selectedPlan.max_limit}M
                </p>
                <p className="text-xs text-[#797979]">Per occurrence / Aggregate · {selectedPlan.carrier}</p>
              </div>

              <div className="border-t border-[#E3E3E3]" />

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Premium',        value: selectedPlan.premium },
                  { label: 'Broker fee',     value: selectedPlan.broker_fee },
                  { label: 'Processing fee', value: selectedPlan.processing_fee },
                  ...(selectedPlan.extra_charge > 0 ? [{ label: 'Private residence', value: selectedPlan.extra_charge }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-[#505458]">
                    <span>{row.label}</span>
                    <span>${row.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t-2 border-[#1CA0DF] pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#262D45]">Total due today</span>
                <span className="text-2xl font-extrabold text-[#105778]">${total}</span>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#797979]">
                  <svg className="w-4 h-4 text-[#1CA0DF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  256-bit SSL encryption
                </div>
                <div className="flex items-center gap-2 text-xs text-[#797979]">
                  <svg className="w-4 h-4 text-[#1CA0DF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  A-rated carrier, licensed &amp; bonded
                </div>
                <div className="flex items-center gap-2 text-xs text-[#797979]">
                  <svg className="w-4 h-4 text-[#1CA0DF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Certificate issued same day
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment form ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-[0px_4px_12px_rgba(55,106,136,0.10)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 bg-[#EDF0FA] border-b border-[#E3E3E3]">
                <svg className="w-5 h-5 text-[#1CA0DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h2 className="text-[15px] font-bold text-[#262D45]">Payment details</h2>
              </div>

              <div className="px-6 py-6 space-y-5">

                {/* Card element */}
                <div>
                  <label className="block text-xs font-semibold text-[#262D45] mb-2">
                    Credit or debit card <span className="text-[#E0232C]">*</span>
                  </label>
                  <div className="rounded-xl border border-[#E3E3E3] bg-white px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#1CA0DF]/30 focus-within:border-[#1CA0DF] transition">
                    <CardElement options={CARD_STYLE} />
                  </div>
                  <p className="mt-1.5 text-xs text-[#797979]">
                    We accept Visa, Mastercard, Amex, and Discover.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Stripe notice */}
                <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl border border-[#E3E3E3] p-4">
                  <svg className="w-4 h-4 text-[#797979] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-xs text-[#797979] leading-relaxed">
                    Payments are processed securely by{' '}
                    <span className="font-semibold text-[#505458]">Stripe</span>.
                    Your card details are never stored on our servers.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!stripe || submitting}
                  className="w-full py-4 rounded-xl bg-[#E0232C] hover:bg-[#C51E26] text-white font-bold text-base tracking-wide transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Pay ${total} and Get Your Policy
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#797979]">
                  By completing this purchase you agree to our{' '}
                  <a href="/terms" target="_blank" className="text-[#1CA0DF] underline">Terms &amp; Conditions</a>.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>

    </QuoteLayout>
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
