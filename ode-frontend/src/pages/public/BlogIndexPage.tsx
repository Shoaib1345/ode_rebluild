import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import PublicLayout from '../../components/layout/PublicLayout'

interface BlogPost {
  id: number
  title: string
  slug: string
  description: string | null
  img_path: string | null
  created_at: string
}

interface Paginated {
  data: BlogPost[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

function PostCard({ post }: { post: BlogPost }) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-[#1CA0DF] transition-all"
    >
      {post.img_path ? (
        <img
          src={post.img_path}
          alt={post.title}
          className="h-44 w-full object-cover group-hover:opacity-95 transition"
        />
      ) : (
        <div className="h-44 w-full bg-gradient-to-br from-[#EDF0FA] to-[#d4e8f5] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#1CA0DF/70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-2">{date}</p>
        <h2 className="font-bold text-gray-800 text-base mb-2 leading-snug group-hover:text-[#105778] transition line-clamp-2">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-1">
            {post.description}
          </p>
        )}
        <span className="mt-4 text-sm font-semibold text-[#105778] group-hover:underline">
          Read more →
        </span>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}

export default function BlogIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  const { data, isLoading, isError } = useQuery<Paginated>({
    queryKey: ['blog', page],
    queryFn: () => api.get('/blog', { params: { page, per_page: 12 } }).then(r => r.data),
    placeholderData: prev => prev,
    staleTime: 5 * 60 * 1000,
  })

  function goTo(p: number) {
    setSearchParams(p === 1 ? {} : { page: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PublicLayout>

      {/* Hero */}
      <div className="bg-[#105778] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Event Insurance Blog</h1>
          <p className="text-white/80 text-lg">
            Tips, guides, and resources for event planners and hosts.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {isError && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Unable to load posts. Please try again later.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : data?.data.map(post => <PostCard key={post.id} post={post} />)
          }
        </div>

        {/* Empty state */}
        {!isLoading && data?.data.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="font-medium">No posts yet. Check back soon!</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#1CA0DF] hover:text-[#105778] transition"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500 px-3">
              Page {data.current_page} of {data.last_page}
            </span>
            <button
              onClick={() => goTo(page + 1)}
              disabled={page >= data.last_page}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#1CA0DF] hover:text-[#105778] transition"
            >
              Next →
            </button>
          </div>
        )}

      </div>

    </PublicLayout>
  )
}
