import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommissionRow {
  id: number
  user: { id: number; first_name: string; last_name: string; email: string } | null
  lead: { id: number; first_name: string; last_name: string; event_type_label: string; event_date: string } | null
  amount: string
  type: 'affiliate' | 'agent' | 'planner' | 'customer'
  status: 'accrued' | 'paid'
  accrued_at: string
  paid_at: string | null
  paid_method: string | null
  paid_note: string | null
}

interface PaginatedCommissions {
  data: CommissionRow[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

interface PayrollSummary {
  total_accrued: string
  total_paid: string
  by_type: Array<{ type: string; status: string; total: string; count: number }>
}

type PaymentMethod = 'Zelle' | 'Check' | 'ACH' | 'Wire'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  affiliate: 'bg-purple-100 text-purple-700',
  agent:     'bg-orange-100 text-orange-700',
  planner:   'bg-teal-100 text-teal-700',
  customer:  'bg-gray-100 text-gray-600',
}

const PAYMENT_METHODS: PaymentMethod[] = ['Zelle', 'Check', 'ACH', 'Wire']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(val: string | number) {
  return `$${parseFloat(String(val)).toFixed(2)}`
}

function fullName(u: { first_name: string; last_name: string } | null) {
  if (!u) return '—'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
}

// ─── Mark Paid Modal ─────────────────────────────────────────────────────────

interface MarkPaidModalProps {
  title: string
  onClose: () => void
  onSubmit: (method: PaymentMethod, note: string) => void
  loading: boolean
}

function MarkPaidModal({ title, onClose, onSubmit, loading }: MarkPaidModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('Zelle')
  const [note, setNote]     = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment method <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Sent via Zelle on Apr 23"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(method, note)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-40"
          >
            {loading ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: PayrollSummary | undefined }) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // Aggregate accrued by type
  const accruedByType: Record<string, number> = {}
  summary.by_type.forEach((row) => {
    if (row.status === 'accrued') {
      accruedByType[row.type] = parseFloat(row.total)
    }
  })

  const cards = [
    { label: 'Total Owed', value: fmtMoney(summary.total_accrued), color: 'text-[#1CA0DF]' },
    { label: 'Total Paid Out', value: fmtMoney(summary.total_paid), color: 'text-green-600' },
    { label: 'Affiliates Owed', value: fmtMoney(accruedByType['affiliate'] ?? 0), color: 'text-purple-600' },
    { label: 'Agents Owed', value: fmtMoney(accruedByType['agent'] ?? 0), color: 'text-orange-600' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">{c.label}</p>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPayrollPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [type,   setType]   = useState(searchParams.get('type')   ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [from,   setFrom]   = useState(searchParams.get('from')   ?? '')
  const [to,     setTo]     = useState(searchParams.get('to')     ?? '')
  const [page,   setPage]   = useState(Number(searchParams.get('page') ?? 1))

  // Checkbox selection
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Modal state
  const [modalTarget, setModalTarget] = useState<'single' | 'bulk' | null>(null)
  const [singleId,    setSingleId]    = useState<number | null>(null)

  // Build query params
  const params: Record<string, string> = { page: String(page), per_page: '25' }
  if (type)   params.type   = type
  if (status) params.status = status
  if (from)   params.from   = from
  if (to)     params.to     = to

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-payroll', params],
    queryFn:   () => api.get<PaginatedCommissions>('/admin/payroll', { params }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: summary } = useQuery({
    queryKey:  ['admin-payroll-summary'],
    queryFn:   () => api.get<PayrollSummary>('/admin/payroll/summary').then(r => r.data),
    staleTime: 30_000,
  })

  // ── Mutations ────────────────────────────────────────────────────────────────

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method, note }: { id: number; method: PaymentMethod; note: string }) =>
      api.patch(`/admin/payroll/${id}/pay`, { paid_method: method, paid_note: note || undefined }),
    onSuccess: () => {
      toast.success('Commission marked as paid.')
      queryClient.invalidateQueries({ queryKey: ['admin-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-summary'] })
      closeModal()
    },
    onError: () => toast.error('Failed to mark commission as paid.'),
  })

  const bulkPayMutation = useMutation({
    mutationFn: ({ ids, method, note }: { ids: number[]; method: PaymentMethod; note: string }) =>
      api.post('/admin/payroll/bulk-pay', { ids, paid_method: method, paid_note: note || undefined }),
    onSuccess: (res) => {
      const count = res.data?.paid_count ?? 0
      toast.success(`Marked ${count} commission(s) as paid.`)
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['admin-payroll-summary'] })
      closeModal()
    },
    onError: () => toast.error('Bulk pay failed.'),
  })

  // ── URL sync ─────────────────────────────────────────────────────────────────

  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const next: Record<string, string> = { page: '1' }
    if (type)   next.type   = type
    if (status) next.status = status
    if (from)   next.from   = from
    if (to)     next.to     = to
    Object.assign(next, overrides)
    setSearchParams(next, { replace: true })
  }, [type, status, from, to, setSearchParams])

  const handleFilter = (key: string, val: string) => {
    setPage(1)
    setSelected(new Set())
    const updates: Record<string, string> = { [key]: val }
    syncUrl(updates)
  }

  const handlePage = (p: number) => {
    setPage(p)
    setSelected(new Set())
    syncUrl({ page: String(p) })
  }

  // ── Selection helpers ─────────────────────────────────────────────────────────

  const rows = data?.data ?? []
  const accrued = rows.filter((r) => r.status === 'accrued')

  const toggleAll = () => {
    if (selected.size === accrued.length && accrued.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(accrued.map((r) => r.id)))
    }
  }

  const toggleRow = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openSingle = (id: number) => {
    setSingleId(id)
    setModalTarget('single')
  }

  const openBulk = () => setModalTarget('bulk')

  const closeModal = () => {
    setModalTarget(null)
    setSingleId(null)
  }

  const handleModalSubmit = (method: PaymentMethod, note: string) => {
    if (modalTarget === 'single' && singleId !== null) {
      markPaidMutation.mutate({ id: singleId, method, note })
    } else if (modalTarget === 'bulk') {
      bulkPayMutation.mutate({ ids: Array.from(selected), method, note })
    }
  }

  const modalLoading = markPaidMutation.isPending || bulkPayMutation.isPending

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Payroll</h1>
          <div className="flex items-center gap-3">
            {data && <span className="text-xs text-gray-400">{data.total.toLocaleString()} records</span>}
            {selected.size > 0 && (
              <button
                onClick={openBulk}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Mark {selected.size} Paid
              </button>
            )}
            <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); handleFilter('type', e.target.value) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            <option value="">All types</option>
            <option value="affiliate">Affiliate</option>
            <option value="agent">Agent</option>
            <option value="planner">Planner</option>
            <option value="customer">Customer</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); handleFilter('status', e.target.value) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            <option value="">All statuses</option>
            <option value="accrued">Accrued</option>
            <option value="paid">Paid</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); handleFilter('from', e.target.value) }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); handleFilter('to', e.target.value) }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
          </div>

          {(type || status || from || to) && (
            <button
              onClick={() => {
                setType(''); setStatus(''); setFrom(''); setTo(''); setPage(1)
                setSearchParams({ page: '1' }, { replace: true })
              }}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={accrued.length > 0 && selected.size === accrued.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Earner</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Accrued</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Method</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 10 }).map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : rows.map((row) => (
                        <tr key={row.id} className={`hover:bg-[#EDF0FA] transition-colors ${selected.has(row.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-3">
                            {row.status === 'accrued' && (
                              <input
                                type="checkbox"
                                checked={selected.has(row.id)}
                                onChange={() => toggleRow(row.id)}
                                className="rounded border-gray-300 text-[#1CA0DF] focus:ring-[#1CA0DF]"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{fullName(row.user)}</p>
                            {row.user && (
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{row.user.email}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.lead ? (
                              <>
                                <p className="text-sm text-gray-700 whitespace-nowrap">{fullName(row.lead)}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[140px]">{row.lead.event_type_label}</p>
                              </>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[row.type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{fmtMoney(row.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${row.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(row.accrued_at)}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(row.paid_at)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{row.paid_method ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {row.status === 'accrued' && (
                              <button
                                onClick={() => openSingle(row.id)}
                                className="px-3 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg transition-colors whitespace-nowrap"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {!isLoading && rows.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No commissions found matching your filters.
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
                      className={`px-3 py-1.5 rounded border transition-colors ${p === page ? 'border-[#1CA0DF] bg-[#1CA0DF] text-white' : 'border-gray-200 hover:bg-gray-50'}`}
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

      {/* Mark Paid Modal */}
      {modalTarget && (
        <MarkPaidModal
          title={
            modalTarget === 'bulk'
              ? `Mark ${selected.size} Commission(s) as Paid`
              : 'Mark Commission as Paid'
          }
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          loading={modalLoading}
        />
      )}
    </AdminLayout>
  )
}
