import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface W9Row {
  id: number
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
    role: { role_name: string; access_level: number } | null
  } | null
  file_name: string
  file_size: number
  status: 'pending' | 'verified'
  verified_at: string | null
  verified_by: { id: number; name: string } | null
  created_at: string
}

interface PaginatedW9 {
  data: W9Row[]
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<number, string> = {
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

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fullName(u: { first_name: string; last_name: string } | null) {
  if (!u) return '—'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
}

// ─── Verify Button ────────────────────────────────────────────────────────────

function VerifyButton({ userId, onVerified }: { userId: number; onVerified: () => void }) {
  const [confirming, setConfirming] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.patch(`/admin/users/${userId}/w9/verify`),
    onSuccess: () => {
      toast.success('W9 verified.')
      setConfirming(false)
      onVerified()
    },
    onError: () => {
      toast.error('Verification failed.')
      setConfirming(false)
    },
  })

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => mutate()}
          disabled={isPending}
          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-40"
        >
          {isPending ? '…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium rounded-lg border border-yellow-200 transition-colors whitespace-nowrap"
    >
      Verify
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminW9Page() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [page,   setPage]   = useState(Number(searchParams.get('page') ?? 1))

  const params: Record<string, string> = { page: String(page), per_page: '25' }
  if (search) params.search = search
  if (status) params.status = status

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-w9', params],
    queryFn:   () => api.get<PaginatedW9>('/admin/w9', { params }).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const next: Record<string, string> = { page: '1' }
    if (search) next.search = search
    if (status) next.status = status
    Object.assign(next, overrides)
    setSearchParams(next, { replace: true })
  }, [search, status, setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const next: Record<string, string> = { page: '1' }
    if (search) next.search = search
    if (status) next.status = status
    setSearchParams(next, { replace: true })
  }

  const handleStatusChange = (val: string) => {
    setStatus(val)
    setPage(1)
    syncUrl({ status: val })
  }

  const handlePage = (p: number) => {
    setPage(p)
    syncUrl({ page: String(p) })
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-w9'] })
  }

  // Pending count for the alert banner
  const pendingCount = !status && data
    ? data.data.filter((r) => r.status === 'pending').length
    : null

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">W9 Management</h1>
          <div className="flex items-center gap-3">
            {data && <span className="text-xs text-gray-400">{data.total.toLocaleString()} uploads</span>}
            <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {/* Pending alert */}
        {pendingCount !== null && pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>{pendingCount}</strong> pending W9{pendingCount !== 1 ? 's' : ''} on this page awaiting verification.
            </span>
            <button
              onClick={() => handleStatusChange('pending')}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Show only pending
            </button>
          </div>
        )}

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
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>

          {(search || status) && (
            <button
              onClick={() => {
                setSearch(''); setStatus(''); setPage(1)
                setSearchParams({ page: '1' }, { replace: true })
              }}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isError ? (
            <div className="px-6 py-10 text-center text-sm text-red-600">
              Failed to load W9 uploads.{' '}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Verified</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">By</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map((row) => (
                        <tr key={row.id} className="hover:bg-[#EDF0FA] transition-colors">
                          {/* User */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => row.user && navigate(`/admin/users/${row.user.id}`)}
                              className="text-left group"
                            >
                              <p className="text-sm font-medium text-gray-800 group-hover:text-[#1CA0DF] transition-colors whitespace-nowrap">
                                {fullName(row.user)}
                              </p>
                              {row.user && (
                                <p className="text-xs text-gray-400 truncate max-w-[180px]">{row.user.email}</p>
                              )}
                            </button>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            {row.user?.role ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[row.user.role.access_level] ?? 'bg-gray-100 text-gray-500'}`}>
                                {row.user.role.role_name}
                              </span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>

                          {/* File */}
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700 truncate max-w-[160px]">{row.file_name}</p>
                            <p className="text-xs text-gray-400">{fmtSize(row.file_size)}</p>
                          </td>

                          {/* Uploaded */}
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {fmtDate(row.created_at)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              row.status === 'verified'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>

                          {/* Verified at */}
                          <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                            {fmtDate(row.verified_at)}
                          </td>

                          {/* Verified by */}
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {row.verified_by?.name ?? '—'}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            {row.status === 'pending' && row.user && (
                              <VerifyButton userId={row.user.id} onVerified={invalidate} />
                            )}
                            {row.status === 'verified' && (
                              <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {!isLoading && data?.data.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-400">
                  No W9 uploads found matching your filters.
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
