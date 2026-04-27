import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'

interface ReferralRow {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  event_type_label: string | null
  event_date: string | null
  event_state: string | null
  carrier: string | null
  submission_status: string
  created_at: string
}

interface PaginatedReferrals {
  data: ReferralRow[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

const STATUSES = [
  { value: '',                    label: 'All statuses' },
  { value: 'tried',               label: 'Started' },
  { value: 'saved',               label: 'Saved' },
  { value: 'mq',                  label: 'Manual Quote' },
  { value: 'plan_added_manually', label: 'Plan Added' },
  { value: 'payment',             label: 'Awaiting Payment' },
  { value: 'payment_received',    label: 'Paid' },
  { value: 'finished',            label: 'Finished' },
]

const STATUS_BADGE: Record<string, string> = {
  tried:                'bg-gray-100 text-gray-600',
  saved:                'bg-yellow-100 text-yellow-700',
  mq:                   'bg-orange-100 text-orange-700',
  plan_added_manually:  'bg-purple-100 text-purple-700',
  payment:              'bg-blue-100 text-blue-700',
  payment_received:     'bg-green-100 text-green-700',
  finished:             'bg-green-200 text-green-800',
}

const STATUS_LABELS: Record<string, string> = {
  tried:                'Started',
  saved:                'Saved',
  mq:                   'Manual Quote',
  plan_added_manually:  'Plan Added',
  payment:              'Awaiting Payment',
  payment_received:     'Paid',
  finished:             'Finished',
}

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function PlannerReferralsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page, setPage]     = useState(Number(searchParams.get('page') ?? 1))

  const params: Record<string, string> = { page: String(page), per_page: '25' }
  if (status) params.status = status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['planner-referrals', page, status],
    queryFn:  () => api.get<PaginatedReferrals>('/planner/referrals', { params }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const next: Record<string, string> = { page: String(page), ...overrides }
    if (status) next.status = status
    setSearchParams(next, { replace: true })
  }, [page, status, setSearchParams])

  const handleStatusChange = (val: string) => {
    setStatus(val)
    setPage(1)
    const next: Record<string, string> = { page: '1' }
    if (val) next.status = val
    setSearchParams(next, { replace: true })
  }

  const handlePage = (p: number) => {
    setPage(p)
    syncUrl({ page: String(p) })
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">My Referrals</h1>
        {data && (
          <span className="text-xs text-gray-400">{data.total.toLocaleString()} total</span>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors ml-auto"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isError ? (
          <div className="px-6 py-10 text-center text-sm text-red-600">
            Failed to load referrals.{' '}
            <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Event Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Event Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">State</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Referred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-3 bg-gray-200 rounded w-3/4"/>
                          </td>
                        ))}
                      </tr>
                    ))
                  : data?.data.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">#{row.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                          {[row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {row.event_type_label ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {fmtDate(row.event_date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {row.event_state ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.submission_status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[row.submission_status] ?? row.submission_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(row.created_at)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>

            {!isLoading && data?.data.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                {status ? 'No referrals match this filter.' : 'No referrals yet. Share your referral link to get started.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.from}–{data.to} of {data.total.toLocaleString()}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => handlePage(page - 1)}
              className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: data.last_page }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === data.last_page || Math.abs(p - page) <= 2)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`e-${i}`} className="px-2 text-gray-300">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePage(p as number)}
                    className={`px-3 py-1.5 rounded border transition-colors ${
                      p === page ? 'border-[#1CA0DF] bg-[#1CA0DF] text-white' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              disabled={page >= data.last_page}
              onClick={() => handlePage(page + 1)}
              className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
