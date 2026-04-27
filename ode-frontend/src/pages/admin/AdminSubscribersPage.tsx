import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscriber {
  id: number
  email: string
  name: string | null
  is_active: boolean
  subscribed_at: string
}

interface PaginatedSubscribers {
  data: Subscriber[]
  total: number
  current_page: number
  last_page: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSubscribersPage() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [page, setPage]         = useState(1)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const { data, isLoading } = useQuery<PaginatedSubscribers>({
    queryKey: ['admin', 'subscribers', search, status, page],
    queryFn:  () => api.get(`/admin/subscribers?${params.toString()}`).then(r => r.data),
  })

  const subscribers = data?.data ?? []

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/subscribers/${id}`),
    onSuccess: () => {
      toast.success('Subscriber removed.')
      qc.invalidateQueries({ queryKey: ['admin', 'subscribers'] })
      setDeletingId(null)
    },
    onError: () => toast.error('Failed to remove subscriber.'),
  })

  // ── CSV Export ─────────────────────────────────────────────────────────────

  function handleExport() {
    window.open('/api/admin/subscribers/export', '_blank')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Subscribers">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Newsletter subscribers — {data?.total ?? 0} total
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by email or name…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-64"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Unsubscribed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading subscribers…</div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg font-medium">No subscribers found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscribed</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {subscribers.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{sub.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sub.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sub.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {sub.is_active ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sub.subscribed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {deletingId === sub.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-gray-500">Remove?</span>
                        <button
                          onClick={() => deleteMutation.mutate(sub.id)}
                          disabled={deleteMutation.isPending}
                          className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? 'Removing…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(sub.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {data.current_page} of {data.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.last_page}
                className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white disabled:opacity-40"
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
