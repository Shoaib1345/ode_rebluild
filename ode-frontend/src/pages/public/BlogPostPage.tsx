import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import PublicLayout from '../../components/layout/PublicLayout'

interface BlogPost {
  id: number
  title: string
  slug: string
  keywords: string | null
  description: string | null
  img_path: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ['blog-post', slug],
    queryFn: () => api.get(`/blog/${slug}`).then(r => r.data),
    enabled: !!slug,
    retry: false,
  })

  const formattedDate = post
    ? new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  return (
    <PublicLayout>

      {isLoading && (
        <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-56 bg-gray-200 rounded-xl mt-6" />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${85 + (i % 3) * 5}%` }} />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h1>
          <p className="text-gray-500 mb-8">This post doesn't exist or has been removed.</p>
          <Link to="/blog" className="bg-[#105778] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0b3f57] transition">
            Back to Blog
          </Link>
        </div>
      )}

      {post && (
        <>
          {/* Hero image or header */}
          {post.img_path ? (
            <div
              className="h-64 sm:h-80 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${post.img_path})` }}
            >
              <div className="absolute inset-0 bg-[#105778]/55" />
            </div>
          ) : (
            <div className="h-3 bg-[#105778]" />
          )}

          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

            {/* Breadcrumb */}
            <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-[#1CA0DF] transition">Home</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-[#1CA0DF] transition">Blog</Link>
              <span>/</span>
              <span className="text-gray-600 truncate max-w-xs">{post.title}</span>
            </nav>

            {/* Title + meta */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {post.title}
            </h1>
            <p className="text-sm text-gray-400 mb-8">{formattedDate}</p>

            {/* Description (lead text) */}
            {post.description && (
              <p className="text-lg text-gray-600 leading-relaxed mb-8 border-l-4 border-[#1CA0DF]/30 pl-4">
                {post.description}
              </p>
            )}

            {/* Body */}
            {post.content ? (
              <div
                className="prose prose-blue prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-gray-400 italic">No content available.</p>
            )}

            {/* Tags */}
            {post.keywords && (
              <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
                {post.keywords.split(',').map(k => k.trim()).filter(Boolean).map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#EDF0FA] text-[#105778] text-xs font-medium rounded-full border border-[#EDF0FA]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Back + CTA */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-8">
              <Link to="/blog" className="text-sm text-[#105778] hover:underline font-medium">
                ← Back to Blog
              </Link>
              <Link
                to="/onedayevent"
                className="bg-[#105778] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0b3f57] transition text-sm"
              >
                Get an Instant Quote →
              </Link>
            </div>

          </div>
        </>
      )}

    </PublicLayout>
  )
}
