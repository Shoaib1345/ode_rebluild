import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageRow {
  id: number
  title: string
  slug: string
  navbar_text: string | null
  sort_order: number
  add_to_menu: boolean
  status: number
  updated_at: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPagesPage() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const { data: pages = [], isLoading } = useQuery<PageRow[]>({
    queryKey: ['admin', 'pages', search, status],
    queryFn:  () => api.get(`/admin/pages?${params.toString()}`).then(r => r.data),
  })

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/pages/${id}`),
    onSuccess: () => {
      toast.success('Page deleted.')
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] })
      setDeletingId(null)
    },
    onError: () => toast.error('Failed to delete page.'),
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="CMS Pages">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CMS Pages</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage public-facing pages and navigation order.
          </p>
        </div>
        <Link
          to="/admin/pages/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + New Page
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or slug…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-64"
        />
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">All statuses</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading pages…</div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg font-medium mb-1">No pages found</p>
            <p className="text-sm">
              <Link to="/admin/pages/new" className="text-blue-600 hover:underline">
                Create your first page
              </Link>
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nav</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pages.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Sort order */}
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">{p.sort_order}</td>

                  {/* Title */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{p.title}</span>
                    {p.navbar_text && p.navbar_text !== p.title && (
                      <span className="ml-2 text-xs text-gray-400">(nav: {p.navbar_text})</span>
                    )}
                  </td>

                  {/* Slug */}
                  <td className="px-6 py-4">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      /{p.slug}
                    </code>
                  </td>

                  {/* In nav */}
                  <td className="px-6 py-4">
                    {p.add_to_menu ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        In menu
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 1
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.status === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/admin/pages/${p.id}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </Link>

                      {deletingId === p.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button
                            onClick={() => deleteMutation.mutate(p.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? 'Deleting…' : 'Yes'}
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
                          onClick={() => setDeletingId(p.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  )
}
