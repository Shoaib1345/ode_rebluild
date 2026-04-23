import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import PublicLayout from '../../components/layout/PublicLayout'

interface CmsPage {
  id: number
  title: string
  slug: string
  meta_keywords: string | null
  meta_description: string | null
  editor_content: string | null
  header_content: string | null
  content_title: string | null
  banner_image: string | null
  content_image: string | null
  tips_heading: string | null
  tip1_text: string | null
  tip2_text: string | null
  tip3_text: string | null
  tip1_image: string | null
  tip2_image: string | null
  tip3_image: string | null
}

export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: page, isLoading, isError } = useQuery<CmsPage>({
    queryKey: ['page', slug],
    queryFn: () => api.get(`/pages/${slug}`).then(r => r.data),
    enabled: !!slug,
    retry: false,
  })

  return (
    <PublicLayout>
      {isLoading && (
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      )}

      {isError && (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
          <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="bg-[#105778] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#0b3f57] transition">
            Back to Home
          </Link>
        </div>
      )}

      {page && (
        <>
          {/* Banner / hero */}
          {page.banner_image ? (
            <div
              className="h-56 sm:h-72 bg-cover bg-center relative"
              style={{ backgroundImage: `url(${page.banner_image})` }}
            >
              <div className="absolute inset-0 bg-[#105778]/60 flex items-center justify-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-white text-center px-4">
                  {page.content_title ?? page.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="bg-[#105778] text-white py-14 px-4 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold">
                {page.content_title ?? page.title}
              </h1>
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

            {/* Header content (sub-heading / intro) */}
            {page.header_content && (
              <div
                className="text-lg text-gray-600 mb-10 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page.header_content }}
              />
            )}

            {/* Content image + editor content */}
            <div className="flex flex-col lg:flex-row gap-8">
              {page.content_image && (
                <div className="lg:w-1/3 flex-shrink-0">
                  <img
                    src={page.content_image}
                    alt={page.title}
                    className="rounded-xl w-full object-cover shadow"
                  />
                </div>
              )}
              {page.editor_content && (
                <div
                  className="prose prose-blue max-w-none flex-1 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: page.editor_content }}
                />
              )}
            </div>

            {/* Tips section */}
            {(page.tip1_text || page.tip2_text || page.tip3_text) && (
              <div className="mt-14">
                {page.tips_heading && (
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                    {page.tips_heading}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {([
                    { text: page.tip1_text, img: page.tip1_image },
                    { text: page.tip2_text, img: page.tip2_image },
                    { text: page.tip3_text, img: page.tip3_image },
                  ] as { text: string | null; img: string | null }[])
                    .filter(t => t.text)
                    .map((tip, i) => (
                      <div key={i} className="bg-[#EDF0FA] border border-[#EDF0FA] rounded-xl p-5">
                        {tip.img && (
                          <img src={tip.img} alt="" className="rounded-lg w-full h-36 object-cover mb-4" />
                        )}
                        <div
                          className="text-sm text-gray-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: tip.text! }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-14 text-center">
              <Link
                to="/onedayevent"
                className="inline-block bg-[#105778] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#0b3f57] transition"
              >
                Get a Quote
              </Link>
            </div>

          </div>
        </>
      )}
    </PublicLayout>
  )
}
