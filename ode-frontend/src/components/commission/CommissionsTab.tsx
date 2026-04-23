import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import W9UploadCard from './W9UploadCard'

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
  type: 'affiliate' | 'agent' | 'planner' | 'customer'
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

interface SummaryResponse {
  w9_verified: boolean
  total_earned: number | null
  total_accrued: number | null
  total_paid: number | null
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const TYPE_LABEL: Record<string, string> = {
  affiliate: 'Affiliate',
  agent:     'Agent',
  planner:   'Planner',
  customer:  'Customer Referral',
}

const TYPE_COLOR: Record<string, string> = {
  affiliate: 'bg-blue-100 text-blue-700',
  agent:     'bg-purple-100 text-purple-700',
  planner:   'bg-orange-100 text-orange-700',
  customer:  'bg-teal-100 text-teal-700',
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary, loading }: { summary?: SummaryResponse; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-5 py-5 animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!summary) return null

  const gated = !summary.w9_verified

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Total earned</p>
        <p className={`text-2xl font-bold ${gated ? 'text-gray-300' : 'text-gray-800'}`}>
          {gated ? '—' : fmtMoney(summary.total_earned)}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Pending</p>
        <p className={`text-2xl font-bold ${gated ? 'text-gray-300' : 'text-[#1CA0DF]'}`}>
          {gated ? '—' : fmtMoney(summary.total_accrued)}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Paid out</p>
        <p className={`text-2xl font-bold ${gated ? 'text-gray-300' : 'text-green-600'}`}>
          {gated ? '—' : fmtMoney(summary.total_paid)}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Commissions</p>
        <p className="text-2xl font-bold text-gray-800">{summary.count}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CommissionsTab
 *
 * Displays W9 upload card + commission history for the authenticated user.
 * Shared across affiliate, agent, planner, and customer portals.
 */
export default function CommissionsTab() {
  const [page,       setPage]       = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'accrued' | 'paid'>('all')

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey:  ['commissions-summary'],
    queryFn:   () => api.get<SummaryResponse>('/commissions/summary').then((r) => r.data),
    staleTime: 60 * 1000,
  })

  const { data, isLoading: listLoading } = useQuery({
    queryKey:  ['commissions', page, statusFilter],
    queryFn:   () => api.get<CommissionsResponse>('/commissions', {
      params: {
        page,
        per_page: 20,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      },
    }).then((r) => r.data),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const gated = data ? !data.w9_verified : false

  return (
    <div className="space-y-5">

      {/* ── W9 upload card ──────────────────────────────────────── */}
      <W9UploadCard />

      {/* ── Summary cards ───────────────────────────────────────── */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* ── Commission list ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-800">Commission history</h2>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-[#1CA0DF]"
          >
            <option value="all">All</option>
            <option value="accrued">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {gated && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
            Amounts are hidden until your W9 is verified. Upload your W9 above to unlock them.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Event', 'Type', 'Amount', 'Status', 'Accrued', 'Paid'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-100 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.commissions.data.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{c.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
                        <div className="truncate">{c.lead?.event_name ?? `Lead #${c.lead_id}`}</div>
                        {c.lead?.event_date && (
                          <div className="text-xs text-gray-400 mt-0.5">{fmtDate(c.lead.event_date)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[c.type] ?? 'bg-gray-100 text-gray-500'}`}>
                          {TYPE_LABEL[c.type] ?? c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {c.amount === null ? (
                          <span className="text-gray-300 font-normal">—</span>
                        ) : (
                          <span className="text-gray-800">{fmtMoney(parseFloat(c.amount))}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(c.accrued_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {c.paid_at ? fmtDate(c.paid_at) : '—'}
                        {c.paid_method && <span className="ml-1 text-gray-300">({c.paid_method})</span>}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!listLoading && data?.commissions.data.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No commissions recorded yet. Commissions appear here when a referred lead completes payment.
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.commissions.last_page > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>{data.commissions.total} total</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-gray-600">{page} / {data.commissions.last_page}</span>
              <button disabled={page >= data.commissions.last_page} onClick={() => setPage(page + 1)}
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
