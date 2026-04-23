import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventRow {
  id: number
  event_name: string | null
  event_type_label: string | null
  event_date: string | null
  event_state: string | null
  carrier: string | null
  premium: number | null
  bound: boolean
  certificate_url: string
  purchased_at: string
}

interface EventsPage {
  data: EventRow[]
  current_page: number
  last_page: number
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerEventsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey:  ['customer-events', page],
    queryFn:   () => api.get<EventsPage>('/customer/events', { params: { page, per_page: 20 } }).then((r) => r.data),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const handleCOI = async (event: EventRow) => {
    try {
      // Attempt to open the certificate URL — will show the stub message for now.
      // When Chunk 44 (PDF generation) ships, this will redirect to the real PDF.
      const res = await api.get(event.certificate_url.replace(window.location.origin + '/api', ''))
      toast(res.data?.message ?? 'Certificate requested.', { icon: 'ℹ️' })
    } catch {
      toast.error('Unable to retrieve certificate. Please contact support.')
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Policies</h1>
        <p className="text-sm text-gray-500 mt-1">
          All your purchased event insurance policies. Download your Certificate of Insurance from here.
        </p>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Event', 'Event date', 'State', 'Carrier', 'Premium', 'Bound', 'Purchased', 'COI'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-100 rounded w-3/4"/>
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{ev.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                          {ev.event_name || '—'}
                        </p>
                        {ev.event_type_label && (
                          <p className="text-xs text-gray-400 mt-0.5">{ev.event_type_label}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {fmtDate(ev.event_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ev.event_state ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ev.carrier ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {fmtMoney(ev.premium)}
                      </td>
                      <td className="px-4 py-3">
                        {ev.bound ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Bound
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(ev.purchased_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCOI(ev)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#1CA0DF] border border-[#1CA0DF] rounded-lg hover:bg-[#EDF0FA] transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                          COI
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && data?.data.length === 0 && (
            <div className="px-6 py-16 text-center">
              <svg className="mx-auto w-12 h-12 text-gray-200 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm font-medium text-gray-400">No policies yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Once your event insurance is purchased, it will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} total</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                ← Prev
              </button>
              <span className="px-3 py-1.5">{page} / {data.last_page}</span>
              <button disabled={page >= data.last_page} onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Info callout ─────────────────────────────────── */}
      <div className="rounded-xl bg-[#EDF0FA] border border-[#1CA0DF]/20 px-5 py-4 text-xs text-[#105778]">
        <strong>Need your Certificate of Insurance?</strong> Click the "COI" button next to any policy.
        If you have trouble downloading, email us at{' '}
        <a href="mailto:support@onedayevent.com" className="underline">support@onedayevent.com</a>{' '}
        with your policy number.
      </div>
    </div>
  )
}
