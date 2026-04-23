import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceRow {
  id: number
  encode_id: string
  lead_id: number
  event_type: string | null
  carrier: string | null
  effective_date: string | null
  total_payable: string
  status: 'open' | 'paid'
  pay_url: string
  created_at: string
}

interface InvoicesPage {
  data: InvoiceRow[]
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

function fmtMoney(str: string) {
  return parseFloat(str).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

type StatusFilter = 'all' | 'open' | 'paid'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerInvoicesPage() {
  const [page,   setPage]   = useState(1)
  const [filter, setFilter] = useState<StatusFilter>('all')

  const { data, isLoading } = useQuery({
    queryKey:  ['customer-invoices', page, filter],
    queryFn:   () => api.get<InvoicesPage>('/customer/invoices', {
      params: { page, per_page: 20, ...(filter !== 'all' ? { status: filter } : {}) },
    }).then((r) => r.data),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const tabCls = (t: StatusFilter) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      filter === t
        ? 'border-[#1CA0DF] text-[#1CA0DF]'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and pay outstanding invoices for your event insurance policies.
        </p>
      </div>

      {/* ── Filter tabs ─────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          <button className={tabCls('all')}  onClick={() => { setFilter('all');  setPage(1) }}>All</button>
          <button className={tabCls('open')} onClick={() => { setFilter('open'); setPage(1) }}>Open</button>
          <button className={tabCls('paid')} onClick={() => { setFilter('paid'); setPage(1) }}>Paid</button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Invoice', 'Event type', 'Carrier', 'Effective date', 'Amount', 'Status', 'Issued', 'Action'].map((h) => (
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
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-100 rounded w-3/4"/>
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">
                        #{inv.encode_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{inv.event_type ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.carrier ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {fmtDate(inv.effective_date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        {fmtMoney(inv.total_payable)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status === 'paid' ? 'Paid' : 'Open'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(inv.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === 'open' ? (
                          <a
                            href={inv.pay_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex px-3 py-1.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                          >
                            Pay now
                          </a>
                        ) : (
                          <a
                            href={inv.pay_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                          >
                            View
                          </a>
                        )}
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
              <p className="text-sm font-medium text-gray-400">
                {filter === 'open' ? 'No open invoices — all paid!' :
                 filter === 'paid' ? 'No paid invoices yet.' :
                 'No invoices found.'}
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
    </div>
  )
}
