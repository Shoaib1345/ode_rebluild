import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: number
  role_id: number
  role: { id: number; role_name: string; access_level: number } | null
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  status: number
  is_on_payroll: boolean
  commission_pct: string
  commission_flat: string
  referral_string: string | null
  created_at: string
}

interface PaginatedUsers {
  data: UserRow[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_FILTERS = [
  { value: 'all',       label: 'All roles' },
  { value: 'staff',     label: 'Staff (0–2)' },
  { value: 'customer',  label: 'Customer' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'agent',     label: 'Agent' },
  { value: 'planner',   label: 'Planner' },
]

const ROLE_BADGE: Record<number, string> = {
  0: 'bg-red-100 text-red-700',
  1: 'bg-red-100 text-red-700',
  2: 'bg-blue-100 text-blue-700',
  5: 'bg-gray-100 text-gray-600',
  6: 'bg-purple-100 text-purple-700',
  7: 'bg-orange-100 text-orange-700',
  8: 'bg-teal-100 text-teal-700',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullName(row: UserRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(' ') || '—'
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [role,   setRole]   = useState(searchParams.get('role')   ?? 'all')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page,   setPage]   = useState(Number(searchParams.get('page') ?? 1))

  const params: Record<string, string> = { page: String(page), per_page: '25', sort: 'created_at', dir: 'desc' }
  if (search) params.search = search
  if (role && role !== 'all') params.role = role
  if (status !== '') params.status = status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-users', params],
    queryFn:   () => api.get<PaginatedUsers>('/admin/users', { params }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const next: Record<string, string> = { page: String(page), ...overrides }
    if (search) next.search = search
    if (role && role !== 'all') next.role = role
    if (status !== '') next.status = status
    setSearchParams(next, { replace: true })
  }, [page, search, role, status, setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const next: Record<string, string> = { page: '1' }
    if (search) next.search = search
    if (role && role !== 'all') next.role = role
    if (status !== '') next.status = status
    setSearchParams(next, { replace: true })
  }

  const handleRoleChange = (val: string) => {
    setRole(val)
    setPage(1)
    const next: Record<string, string> = { page: '1' }
    if (search) next.search = search
    if (val !== 'all') next.role = val
    if (status !== '') next.status = status
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
          <h1 className="text-xl font-bold text-gray-800">Users</h1>
          <div className="flex items-center gap-3">
            {data && <span className="text-xs text-gray-400">{data.total.toLocaleString()} total</span>}
            <button
              onClick={() => navigate('/admin/users/new')}
              className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New User
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-48">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
            <button type="submit" className="px-3 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors">
              Search
            </button>
          </form>

          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
          >
            <option value="">All statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors">
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isError ? (
            <div className="px-6 py-10 text-center text-sm text-red-600">
              Failed to load users. <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Comm %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-3/4"/></td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map((u) => (
                        <tr
                          key={u.id}
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="hover:bg-[#EDF0FA] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-xs font-mono text-gray-400">#{u.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                            {fullName(u)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                            {u.email}
                          </td>
                          <td className="px-4 py-3">
                            {u.role && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role.access_level] ?? 'bg-gray-100 text-gray-500'}`}>
                                {u.role.role_name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {u.status ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {parseFloat(u.commission_pct) > 0 ? `${u.commission_pct}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {fmtDate(u.created_at)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {!isLoading && data?.data.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No users found matching your filters.
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
    </AdminLayout>
  )
}
