import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import api from '../../lib/axios'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string)

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicInvoice {
  encode_id: string
  type: 'single' | 'multi_plan'
  first_name: string | null
  last_name: string | null
  email: string | null
  event_type: string | null
  carrier: string | null
  effective_date: string | null
  expiration_date: string | null
  min_limit: number | null
  max_limit: number | null
  broker_fee: string | null
  processing_fee: string | null
  total_premium: string | null
  total_payable: string
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  invoice_status: 0 | 1
  line_items: { fee_type: string | null; amount: string; quantity: number }[]
  coverage_lines: { benefit_type: string | null; benefit_value: string | null }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

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

// ─── Inner form ───────────────────────────────────────────────────────────────

function PayForm({ invoice }: { invoice: PublicInvoice }) {
  const navigate  = useNavigate()
  const stripe    = useStripe()
  const elements  = useElements()
  const [error,   setError]      = useState<string | null>(null)
  const [loading, setLoading]    = useState(false)

  const total = Number(invoice.total_payable)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setError(null)
    setLoading(true)

    try {
      const cardEl = elements.getElement(CardElement)
      if (!cardEl) throw new Error('Card element not found.')

      const { error: stripeErr, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardEl,
        billing_details: {
          name:  `${invoice.first_name ?? ''} ${invoice.last_name ?? ''}`.trim() || undefined,
          email: invoice.email ?? undefined,
          address: {
            line1:       invoice.street  ?? undefined,
            city:        invoice.city    ?? undefined,
            state:       invoice.state   ?? undefined,
            postal_code: invoice.zip     ?? undefined,
            country:     'US',
          },
        },
      })

      if (stripeErr) {
        setError(stripeErr.message ?? 'Card error. Please try again.')
        return
      }

      await api.post(`/invoice/${invoice.encode_id}/pay`, {
        stripe_payment_method_id: paymentMethod!.id,
      })

      navigate(`/invoice/${invoice.encode_id}/success`, { replace: true })

    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'An unexpected error occurred. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1CA0DF] uppercase tracking-wide mb-1">
            One Day Event Insurance
          </p>
          <h1 className="text-2xl font-bold text-gray-800">Your Invoice</h1>
          {invoice.first_name && (
            <p className="text-gray-500 text-sm mt-1">
              Hello {invoice.first_name}, your policy is ready for payment.
            </p>
          )}
        </div>

        {/* Policy summary */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
            Policy details
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {invoice.event_type && (
              <>
                <span className="text-gray-400">Event type</span>
                <span className="text-gray-700 font-medium">{invoice.event_type}</span>
              </>
            )}
            {invoice.carrier && (
              <>
                <span className="text-gray-400">Carrier</span>
                <span className="text-gray-700">{invoice.carrier}</span>
              </>
            )}
            {(invoice.min_limit || invoice.max_limit) && (
              <>
                <span className="text-gray-400">Coverage limits</span>
                <span className="text-gray-700">{invoice.min_limit}M / {invoice.max_limit}M</span>
              </>
            )}
            {invoice.effective_date && (
              <>
                <span className="text-gray-400">Effective date</span>
                <span className="text-gray-700">{fmtDate(invoice.effective_date)}</span>
              </>
            )}
            {invoice.expiration_date && (
              <>
                <span className="text-gray-400">Expiration date</span>
                <span className="text-gray-700">{fmtDate(invoice.expiration_date)}</span>
              </>
            )}
          </div>

          {/* Coverage lines */}
          {invoice.coverage_lines.length > 0 && (
            <div className="border-t border-gray-100 pt-4 space-y-1.5">
              {invoice.coverage_lines.map((line, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400">{line.benefit_type}</span>
                  <span className="text-gray-700 font-medium">{line.benefit_value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
          <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100 mb-4">
            Price breakdown
          </h2>
          <div className="space-y-2 text-sm">
            {invoice.line_items.length > 0
              ? invoice.line_items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">
                      {item.fee_type ?? 'Fee'}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </span>
                    <span className="text-gray-700">${(Number(item.amount) * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              : (
                <>
                  {invoice.total_premium && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Premium</span>
                      <span className="text-gray-700">${Number(invoice.total_premium).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.broker_fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Broker fee</span>
                      <span className="text-gray-700">${Number(invoice.broker_fee).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.processing_fee && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Processing fee</span>
                      <span className="text-gray-700">${Number(invoice.processing_fee).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
          </div>
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
            <span className="text-base font-bold text-gray-800">Total due today</span>
            <span className="text-2xl font-bold text-[#105778]">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-100">
              Payment details
            </h2>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Credit or debit card</label>
              <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:ring-2 focus-within:ring-[#1CA0DF]">
                <CardElement options={CARD_STYLE} />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-xs text-gray-400">
              🔒 Payments are processed securely by Stripe. Your card details are never stored on our servers.
            </p>

            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full py-3 rounded-lg bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold text-sm transition-colors disabled:opacity-40"
            >
              {loading ? 'Processing…' : `Pay $${total.toFixed(2)}`}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400">
          Questions? Email us at{' '}
          <a href="mailto:support@onedayevent.com" className="text-[#1CA0DF] underline">
            support@onedayevent.com
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

async function fetchInvoice(encodeId: string): Promise<PublicInvoice> {
  const res = await api.get<PublicInvoice>(`/invoice/${encodeId}`)
  return res.data
}

export default function InvoicePayPage() {
  const { encodeId } = useParams<{ encodeId: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-invoice', encodeId],
    queryFn:  () => fetchInvoice(encodeId!),
    enabled:  !!encodeId,
    retry:    false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1CA0DF]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md px-8 py-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800">Invoice not found</h1>
          <p className="text-sm text-gray-500">
            This invoice link may be invalid or has expired. Please contact us for help.
          </p>
          <a href="mailto:support@onedayevent.com" className="inline-block text-sm text-[#1CA0DF] hover:underline">
            support@onedayevent.com
          </a>
        </div>
      </div>
    )
  }

  // Already paid — show a friendly message instead of the form
  if (data.invoice_status === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EDF0FA] to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md px-8 py-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800">Already paid</h1>
          <p className="text-sm text-gray-500">
            This invoice has already been paid. Thank you! If you have any questions, please contact us.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PayForm invoice={data} />
    </Elements>
  )
}
