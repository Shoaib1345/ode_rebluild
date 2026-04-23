import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

interface BlogPost {
  id: number
  title: string
  slug: string
  status: number
  sort_order: number
  created_at: string
}

interface Paginated {
  data: BlogPost[]
  current_page: number
  last_page: number
  total: number
}

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const search   = searchParams.get('search') ?? ''
  const status   = searchParams.get('status') ?? ''
  const page     = parseInt(searchParams.get('page') ?? '1', 10)
  const sort     = searchParams.get('sort')  ?? 'sort_order'
  const dir      = searchParams.get('dir')   ?? 'asc'

  const [searchInput, setSearchInput] = useState(search)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function setSort(col: string) {
    const next = new URLSearchParams(searchParams)
    if (sort === col) {
      next.set('dir', dir === 'asc' ? 'desc' : 'asc')
    } else {
      next.set('sort', col)
      next.set('dir', 'asc')
    }
    next.delete('page')
    setSearchParams(next)
  }

  function goTo(p: number) {
    const next = new URLSearchParams(searchParams)
    if (p === 1) next.delete('page'); else next.set('page', String(p))
    setSearchParams(next)
  }

  const params = {
    ...(search   && { search }),
    ...(status   && { status }),
    page, sort, dir,
    per_page: 25,
  }

  const { data, isLoading } = useQuery<Paginated>({
    queryKey: ['admin-blog', params],
    queryFn: () => api.get('/admin/blog', { params }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/blog/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blog'] }),
  })

  function handleDelete(id: number, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    deleteMutation.mutate(id)
  }

  function SortIcon({ col }: { col: string }) {
    if (sort !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>
  }

  const thClass = 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700'

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${data.total} post${data.total !== 1 ? 's' : ''}` : '—'}
            </p>
          </div>
          <Link
            to="/admin/blog/new"
            className="bg-[#105778] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0b3f57] transition flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New Post
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form
            className="flex gap-2 flex-1"
            onSubmit={e => { e.preventDefault(); setParam('search', searchInput) }}
          >
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search title or description…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/60"
            />
            <button type="submit" className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition">
              Search
            </button>
          </form>
          <select
            value={status}
            onChange={e => setParam('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/60"
          >
            <option value="">All Statuses</option>
            <option value="1">Published</option>
            <option value="0">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className={thClass} onClick={() => setSort('title')}>
                  Title <SortIcon col="title" />
                </th>
                <th className={thClass + ' hidden md:table-cell'} onClick={() => setSort('sort_order')}>
                  Order <SortIcon col="sort_order" />
                </th>
                <th className={thClass} onClick={() => setSort('status')}>
                  Status <SortIcon col="status" />
                </th>
                <th className={thClass + ' hidden sm:table-cell'} onClick={() => setSort('created_at')}>
                  Created <SortIcon col="created_at" />
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-8" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded w-16" /></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))}

              {!isLoading && data?.data.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">/blog/{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-500">
                    {post.sort_order}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      post.status === 1
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {post.status === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-400 hover:text-[#1CA0DF] transition"
                        title="View on site"
                      >
                        View
                      </a>
                      <Link
                        to={`/admin/blog/${post.id}/edit`}
                        className="text-xs text-[#1CA0DF] hover:text-[#105778] font-medium transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                    No posts found.{' '}
                    <Link to="/admin/blog/new" className="text-[#1CA0DF] hover:underline">Create the first one →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
            <span>Page {data.current_page} of {data.last_page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#1CA0DF] transition"
              >
                ← Prev
              </button>
              <button
                onClick={() => goTo(page + 1)}
                disabled={page >= data.last_page}
                className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#1CA0DF] transition"
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
