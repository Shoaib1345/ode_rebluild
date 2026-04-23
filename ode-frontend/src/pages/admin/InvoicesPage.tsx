import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceRow {
  id: number
  lead_id: number | null
  type: 'single' | 'multi_plan'
  encode_id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  event_type: string | null
  carrier: string | null
  effective_date: string | null
  min_limit: number | null
  max_limit: number | null
  total_payable: string
  invoice_status: 0 | 1
  created_at: string
  lead: { id: number; event_name: string | null } | null
  created_by_user: { id: number; first_name: string; last_name: string } | null
}

interface Paginated {
  data: InvoiceRow[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

async function fetchInvoices(params: Record<string, string>): Promise<Paginated> {
  const res = await api.get<Paginated>('/admin/invoices', { params })
  return res.data
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page,   setPage]   = useState(Number(searchParams.get('page') ?? 1))

  const queryParams: Record<string, string> = { page: String(page), per_page: '25' }
  if (search) queryParams.search = search
  if (status) queryParams.status = status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-invoices', queryParams],
    queryFn:   () => fetchInvoices(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })

  const syncUrl = (overrides: Record<string, string>) => {
    const next: Record<string, string> = { page: String(page), ...overrides }
    if (search) next.search = search
    if (status) next.status = status
    setSearchParams(next, { replace: true })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    syncUrl({ page: '1' })
  }

  const handleStatusChange = (val: string) => {
    setStatus(val)
    setPage(1)
    const next: Record<string, string> = { page: '1' }
    if (search) next.search = search
    if (val)    next.status = val
    setSearchParams(next, { replace: true })
  }

  const handlePage = (p: number) => {
    setPage(p)
    syncUrl({ page: String(p) })
  }

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Invoices</h1>
            {data && <p className="text-xs text-gray-400 mt-0.5">{data.total.toLocaleString()} total</p>}
          </div>
          <button
            onClick={() => navigate('/admin/invoices/new')}
            className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New invoice
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
            <button type="submit" className="px-3 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors">
              Search
            </button>
          </form>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            <option value="">All statuses</option>
            <option value="0">Unpaid</option>
            <option value="1">Paid</option>
          </select>
          <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors">
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isError ? (
            <div className="px-6 py-10 text-center text-sm text-red-600">
              Failed to load invoices.{' '}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['#', 'Recipient', 'Event type', 'Coverage', 'Total', 'Type', 'Status', 'Created'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map((inv) => (
                        <tr
                          key={inv.id}
                          onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                          className="hover:bg-[#EDF0FA] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">#{inv.id}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">
                              {[inv.first_name, inv.last_name].filter(Boolean).join(' ') || '—'}
                            </p>
                            <p className="text-xs text-gray-400">{inv.email ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{inv.event_type ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {inv.min_limit && inv.max_limit ? `${inv.min_limit}M / ${inv.max_limit}M` : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">
                            ${Number(inv.total_payable).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inv.type === 'multi_plan' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {inv.type === 'multi_plan' ? 'Multi-plan' : 'Single'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${inv.invoice_status === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {inv.invoice_status === 1 ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {fmtDate(inv.created_at)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {!isLoading && data?.data.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-400">No invoices found.</div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.from}–{data.to} of {data.total.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => handlePage(page - 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              {Array.from({ length: data.last_page }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.last_page || Math.abs(p - page) <= 2)
                .reduce<(number | '…')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === '…'
                  ? <span key={`e${i}`} className="px-2 text-gray-300">…</span>
                  : <button key={p} onClick={() => handlePage(p as number)}
                      className={`px-3 py-1.5 rounded border transition-colors ${p === page ? 'border-[#1CA0DF] bg-[#1CA0DF] text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                )}
              <button disabled={page >= data.last_page} onClick={() => handlePage(page + 1)}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
