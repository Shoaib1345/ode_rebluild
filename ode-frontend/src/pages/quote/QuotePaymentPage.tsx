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

// Initialise Stripe outside render to avoid re-creating on each render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string)

// ─── Card Element styles ──────────────────────────────────────────────────────

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#374151',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#dc2626' },
  },
}

// ─── Inner form (needs to be inside <Elements>) ───────────────────────────────

function PaymentForm() {
  const navigate     = useNavigate()
  const stripe       = useStripe()
  const elements     = useElements()

  const params       = useQuoteStore((s) => s.params)
  const selectedPlan = useQuoteStore((s) => s.selectedPlan)
  const customerInfo = useQuoteStore((s) => s.customerInfo)
  const reset        = useQuoteStore((s) => s.reset)

  const [error,     setError]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Guard — should never reach here without a plan, but just in case
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
      // 1. Tokenise the card → PaymentMethod
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

      // 2. POST to backend — assemble full payload
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
        // Quote params
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
        // Customer info
        ...customerInfo,
        // Payment
        stripe_payment_method_id: paymentMethod!.id,
      }

      const res = await api.post<{ lead_number: number; message: string }>('/leads', payload)

      // 3. Clear store and navigate to confirmation
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
    <QuoteLayout step={5}>
      {/* Back */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate('/quote/info')}
          className="text-[#1CA0DF] hover:text-[#105778] text-sm font-medium"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Order summary ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md px-6 py-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-700 pb-2 border-b border-gray-100">
              Order summary
            </h2>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Event type</span>
                <span className="font-medium text-gray-800">{params.eventTypeName}</span>
              </div>
              <div className="flex justify-between">
                <span>Coverage</span>
                <span className="font-medium text-gray-800">
                  ${selectedPlan.min_limit}M / ${selectedPlan.max_limit}M
                </span>
              </div>
              <div className="flex justify-between">
                <span>Carrier</span>
                <span className="font-medium text-gray-800">{selectedPlan.carrier}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Premium</span>
                <span>${selectedPlan.premium.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Broker fee</span>
                <span>${selectedPlan.broker_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Processing fee</span>
                <span>${selectedPlan.processing_fee.toFixed(2)}</span>
              </div>
              {selectedPlan.extra_charge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Extra charges</span>
                  <span>${selectedPlan.extra_charge.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-100">
                <span>Total due today</span>
                <span className="text-[#105778]">${total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment form ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-md px-8 py-8 space-y-6">
              <h2 className="text-base font-semibold text-gray-700 pb-2 border-b border-gray-100">
                Payment details
              </h2>

              {/* Card element */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Credit or debit card
                </label>
                <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:ring-2 focus-within:ring-[#1CA0DF]">
                  <CardElement options={CARD_STYLE} />
                </div>
              </div>

              {/* Inline error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Security notice */}
              <p className="text-xs text-gray-400">
                🔒 Payments are processed securely by Stripe. Your card details are never stored on
                our servers.
              </p>

              <button
                type="submit"
                disabled={!stripe || submitting}
                className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40"
              >
                {submitting
                  ? 'Processing…'
                  : `Pay $${total} and Get Your Policy`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </QuoteLayout>
  )
}

// ─── Page wrapper — provides <Elements> context ───────────────────────────────

export default function QuotePaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  )
}
