import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/axios'
import { useQuoteStore } from '../../stores/quoteStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingQuoteResponse {
  current_route: string
  wizard_state: Record<string, unknown>
  email: string
  pending_quote_id: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Route: /quote/resume/:token
 *
 * Fetches a saved pending quote from the backend, restores quoteStore,
 * then redirects to the step where the user left off.
 *
 * §9.4 FULL-SPEC-V2.md
 */
export default function QuoteResumePage() {
  const { token }           = useParams<{ token: string }>()
  const navigate            = useNavigate()
  const restoreFromPending  = useQuoteStore((s) => s.restoreFromPending)

  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid resume link.')
      return
    }

    api.get<PendingQuoteResponse>(`/quotes/pending/${token}`)
      .then(({ data }) => {
        // Restore store from saved snapshot
        restoreFromPending(data.wizard_state, data.pending_quote_id)

        // Navigate to where they left off
        const route = data.current_route || '/quote/dates'
        navigate(route, { replace: true })
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          'This quote link has expired or is no longer available.'
        setStatus('error')
        setMessage(msg)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ── Loading ───────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1CA0DF] mb-4" />
          <p className="text-gray-600 text-sm">Restoring your quote…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Quote not found</h1>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <Link
          to="/onedayevent"
          className="inline-block bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold
            text-sm px-6 py-3 rounded-lg transition-colors"
        >
          Start a new quote
        </Link>
      </div>
    </div>
  )
}
