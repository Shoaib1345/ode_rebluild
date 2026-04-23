import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import W9UploadCard from '../../components/commission/W9UploadCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommissionLead {
  event_name: string | null
  event_date: string | null
  event_type_label: string | null
  status: string
}

interface Commission {
  id: number
  lead_id: number
  lead: CommissionLead | null
  amount: string | null  // null when W9 not verified
  status: 'accrued' | 'paid'
  accrued_at: string | null
  paid_at: string | null
  paid_method: string | null
}

interface CommissionPage {
  data: Commission[]
  current_page: number
  last_page: number
  total: number
}

interface CommissionsResponse {
  w9_verified: boolean
  commissions: CommissionPage
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(v: string | null) {
  if (v === null) return '—'
  const n = parseFloat(v)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentCommissionsPage() {
  const [page,         setPage]         = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const params: Record<string, string> = { page: String(page), per_page: '20' }
  if (statusFilter) params.status = statusFilter

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['agent-commissions', page, statusFilter],
    queryFn:  () => api.get<CommissionsResponse>('/agent/commissions', { params }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const w9Verified = data?.w9_verified ?? false
  const commissions = data?.commissions

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commissions & W9</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your commission earnings from assigned leads. Upload your W9 to unlock amounts.
        </p>
      </div>

      {/* ── W9 Upload Card ───────────────────────────────────────── */}
      <W9UploadCard />

      {/* ── Commission Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Table header + filter */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Commission History</h2>
            {commissions && (
              <span className="text-xs text-gray-400">{commissions.total} total</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!w9Verified && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
                Amounts hidden — W9 required
              </span>
            )}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            >
              <option value="">All statuses</option>
              <option value="accrued">Accrued</option>
              <option value="paid">Paid</option>
            </select>
            <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-600">
            Failed to load commissions.{' '}
            <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Event Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Accrued</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-gray-200 rounded w-3/4"/>
                          </td>
                        ))}
                      </tr>
                    ))
                  : commissions?.data.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">
                            {c.lead?.event_name ?? c.lead?.event_type_label ?? `Lead #${c.lead_id}`}
                          </p>
                          {c.lead?.event_type_label && c.lead?.event_name && (
                            <p className="text-xs text-gray-400">{c.lead.event_type_label}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {fmtDate(c.lead?.event_date ?? null)}
                        </td>
                        <td className="px-4 py-3">
                          {c.amount === null ? (
                            <span className="text-sm text-gray-400 italic">—</span>
                          ) : (
                            <span className="text-sm font-semibold text-gray-800">
                              {fmtMoney(c.amount)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {c.status === 'paid' ? 'Paid' : 'Accrued'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(c.accrued_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {c.paid_at ? fmtDate(c.paid_at) : '—'}
                          {c.paid_method && (
                            <span className="ml-1 text-gray-300">· {c.paid_method}</span>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!isLoading && commissions?.data.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No commissions recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {commissions && commissions.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Page {commissions.current_page} of {commissions.last_page}</span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                disabled={page >= commissions.last_page}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
