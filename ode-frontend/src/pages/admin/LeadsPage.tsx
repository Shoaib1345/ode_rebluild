import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  event_type_label: string | null
  event_date: string | null
  event_state: string | null
  carrier: string | null
  coverage_limit: string | null
  submission_status: string
  bound: boolean
  is_on_hold: boolean
  is_priority_lead: boolean
  created_at: string
}

interface PaginatedLeads {
  data: LeadRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

// ─── View filter config ───────────────────────────────────────────────────────

interface ViewConfig {
  title: string
  /** Extra params merged into every API call for this view */
  apiParams: Record<string, string>
  /** Tailwind bg+text class for the title badge */
  badge?: string
}

const VIEW_CONFIG: Record<string, ViewConfig> = {
  '':          { title: 'All Leads',       apiParams: {},                        badge: 'bg-gray-100 text-gray-600' },
  'priority':  { title: 'Priority Leads',  apiParams: { priority: '1' },         badge: 'bg-amber-100 text-amber-700' },
  'sold':      { title: 'Sold Leads',      apiParams: { sold: '1' },             badge: 'bg-green-100 text-green-700' },
  'past':      { title: 'Past Leads',      apiParams: { past_events: '1' },      badge: 'bg-gray-100 text-gray-600' },
  'follow_up': { title: 'All Follow Up',   apiParams: { follow_up: '1' },        badge: 'bg-blue-100 text-blue-700' },
  'future':    { title: 'Future Leads',    apiParams: { future_events: '1' },    badge: 'bg-purple-100 text-purple-700' },
  'untouched': { title: 'Untouched Leads', apiParams: { untouched: '1' },        badge: 'bg-red-100 text-red-700' },
  'bound':     { title: 'Bound Leads',     apiParams: { bound: '1' },            badge: 'bg-emerald-100 text-emerald-700' },
  'cancelled': { title: 'Cancel Leads',    apiParams: { cancelled: '1' },        badge: 'bg-red-100 text-red-600' },
  'untouch':   { title: 'Untouch Leads',   apiParams: { untouch: '1' },          badge: 'bg-orange-100 text-orange-700' },
  'my_leads':  { title: 'My Leads',        apiParams: { my_leads: '1' },         badge: 'bg-[#EDF0FA] text-[#105778]' },
}

// ─── Status constants ─────────────────────────────────────────────────────────

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
  payment:              'bg-[#EDF0FA] text-[#105778]',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fullName(row: LeadRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || '—'
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-[#1CA0DF]">{dir === 'asc' ? '↑' : '↓'}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  /** Which sub-view to show. Maps to specific API filter params. */
  viewFilter?: string
}

export default function LeadsPage({ viewFilter = '' }: Props) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const cfg = VIEW_CONFIG[viewFilter] ?? VIEW_CONFIG['']

  // User-controllable filter state (from URL)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [sort,   setSort]   = useState(searchParams.get('sort')   ?? 'created_at')
  const [dir,    setDir]    = useState<'asc' | 'desc'>((searchParams.get('dir') as 'asc' | 'desc') ?? 'desc')
  const [page,   setPage]   = useState(Number(searchParams.get('page') ?? 1))

  // Merge view-specific params + user filter params
  const queryParams: Record<string, string> = {
    sort,
    dir,
    page: String(page),
    per_page: '25',
    ...cfg.apiParams,          // view-specific filters (priority, bound, etc.)
  }
  if (search) queryParams.search = search
  if (status) queryParams.status = status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-leads', viewFilter, queryParams],
    queryFn:   async () => {
      const res = await api.get<PaginatedLeads>('/admin/leads', { params: queryParams })
      return res.data
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })

  // Push filter changes to URL
  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const next: Record<string, string> = { sort, dir, page: String(page), ...overrides }
    if (search) next.search = search
    if (status) next.status = status
    setSearchParams(next, { replace: true })
  }, [sort, dir, page, search, status, setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    syncUrl({ page: '1' })
  }

  const handleStatusChange = (val: string) => {
    setStatus(val)
    setPage(1)
    const next: Record<string, string> = { sort, dir, page: '1' }
    if (search) next.search = search
    if (val)    next.status = val
    setSearchParams(next, { replace: true })
  }

  const handleSort = (col: string) => {
    const newDir = sort === col && dir === 'desc' ? 'asc' : 'desc'
    setSort(col); setDir(newDir); setPage(1)
    syncUrl({ sort: col, dir: newDir, page: '1' })
  }

  const handlePage = (p: number) => {
    setPage(p)
    syncUrl({ page: String(p) })
  }

  const thCls = (col: string) =>
    `px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 ${sort === col ? 'text-[#1CA0DF]' : ''}`

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{cfg.title}</h1>
            {cfg.badge && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                {viewFilter === '' ? 'All' : cfg.title.split(' ')[0]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-gray-400">
                {data.total.toLocaleString()} lead{data.total !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filters bar ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/30"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/30 bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {(search || status) && (
            <button
              onClick={() => {
                setSearch(''); setStatus(''); setPage(1)
                setSearchParams({}, { replace: true })
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isError ? (
            <div className="px-6 py-10 text-center text-sm text-red-600">
              Failed to load leads.{' '}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={thCls('id')} onClick={() => handleSort('id')}>
                      # <SortIcon active={sort === 'id'} dir={dir} />
                    </th>
                    <th className={thCls('first_name')} onClick={() => handleSort('first_name')}>
                      Name <SortIcon active={sort === 'first_name'} dir={dir} />
                    </th>
                    <th className={thCls('email')} onClick={() => handleSort('email')}>
                      Email <SortIcon active={sort === 'email'} dir={dir} />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Event Type
                    </th>
                    <th className={thCls('event_date')} onClick={() => handleSort('event_date')}>
                      Event Date <SortIcon active={sort === 'event_date'} dir={dir} />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      State
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Coverage
                    </th>
                    <th className={thCls('submission_status')} onClick={() => handleSort('submission_status')}>
                      Status <SortIcon active={sort === 'submission_status'} dir={dir} />
                    </th>
                    <th className={thCls('created_at')} onClick={() => handleSort('created_at')}>
                      Created <SortIcon active={sort === 'created_at'} dir={dir} />
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => navigate(`/admin/leads/${lead.id}`)}
                          className="hover:bg-[#EDF7FD] cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">
                            #{lead.id}
                            {lead.is_priority_lead && (
                              <span className="ml-1 text-amber-500" title="Priority">★</span>
                            )}
                            {lead.is_on_hold && (
                              <span className="ml-1 text-red-400" title="On hold">⏸</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap group-hover:text-[#1CA0DF] transition-colors">
                            {fullName(lead)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {lead.email ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {lead.event_type_label ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {fmtDate(lead.event_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {lead.event_state ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {lead.coverage_limit ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.submission_status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABELS[lead.submission_status] ?? lead.submission_status}
                            </span>
                            {lead.bound && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                Bound
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {fmtDate(lead.created_at)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {!isLoading && data?.data.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-400">No leads found for this view.</p>
                  {(search || status) && (
                    <button
                      onClick={() => { setSearch(''); setStatus(''); setPage(1); setSearchParams({}, { replace: true }) }}
                      className="mt-2 text-xs text-[#1CA0DF] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="text-xs text-gray-400">
              Showing {data.from}–{data.to} of {data.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
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
                    <span key={`e-${i}`} className="px-2 text-gray-300 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePage(p as number)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors text-xs ${
                        p === page
                          ? 'border-[#1CA0DF] bg-[#1CA0DF] text-white'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                disabled={page >= data.last_page}
                onClick={() => handlePage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
