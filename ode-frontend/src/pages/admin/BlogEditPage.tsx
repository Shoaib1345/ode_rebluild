import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

const schema = z.object({
  title:       z.string().min(1, 'Title is required').max(191),
  slug:        z.string().max(191).optional().or(z.literal('')),
  keywords:    z.string().max(191).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  img_path:    z.string().max(191).optional().or(z.literal('')),
  content:     z.string().optional().or(z.literal('')),
  sort_order:  z.preprocess((v) => Number(v), z.number().int().min(0)),
  status:      z.preprocess((v) => Number(v), z.union([z.literal(0), z.literal(1)])),
})

type FormValues = z.infer<typeof schema>

interface BlogPost {
  id: number
  title: string
  slug: string
  keywords: string | null
  description: string | null
  img_path: string | null
  content: string | null
  sort_order: number
  status: number
}

export default function BlogEditPage() {
  const { id } = useParams<{ id?: string }>()
  const isNew   = !id || id === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: post, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ['admin-blog-post', id],
    queryFn:  () => api.get(`/admin/blog/${id}`).then(r => r.data),
    enabled:  !isNew,
  })

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title:       '',
      slug:        '',
      keywords:    '',
      description: '',
      img_path:    '',
      content:     '',
      sort_order:  0,
      status:      1,
    },
  })

  // Populate form when editing existing post
  useEffect(() => {
    if (post) {
      reset({
        title:       post.title,
        slug:        post.slug,
        keywords:    post.keywords    ?? '',
        description: post.description ?? '',
        img_path:    post.img_path    ?? '',
        content:     post.content     ?? '',
        sort_order:  post.sort_order,
        status:      (post.status === 1 ? 1 : 0) as 0 | 1,
      })
    }
  }, [post, reset])

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/admin/blog', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
      navigate('/admin/blog')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => api.patch(`/admin/blog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
      queryClient.invalidateQueries({ queryKey: ['admin-blog-post', id] })
      navigate('/admin/blog')
    },
  })

  function onSubmit(data: FormValues) {
    // Strip empty strings → undefined so backend treats them as nullable
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
    ) as FormValues

    if (isNew) {
      createMutation.mutate(cleaned)
    } else {
      updateMutation.mutate(cleaned)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const apiError  = createMutation.error || updateMutation.error

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/60 ${
      hasError ? 'border-red-400' : 'border-gray-300'
    }`

  if (!isNew && postLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/blog" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? 'New Blog Post' : 'Edit Post'}
            </h1>
            {!isNew && post && (
              <p className="text-sm text-gray-400 mt-0.5">/blog/{post.slug}</p>
            )}
          </div>
        </div>

        {apiError && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to save. Please check your inputs and try again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input {...register('title')} className={inputClass(!!errors.title)} placeholder="Post title" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
              <span className="text-gray-400 font-normal ml-1">(auto-generated from title if blank)</span>
            </label>
            <input {...register('slug')} className={inputClass(!!errors.slug)} placeholder="url-friendly-slug" />
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
          </div>

          {/* Status + Sort Order row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className={inputClass(false)}>
                <option value={1}>Published</option>
                <option value={0}>Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                min={0}
                {...register('sort_order')}
                className={inputClass(!!errors.sort_order)}
              />
            </div>
          </div>

          {/* Meta description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
              <span className="text-gray-400 font-normal ml-1">(shown in search results & post intro)</span>
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className={inputClass(false)}
              placeholder="Brief summary of the post…"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keywords
              <span className="text-gray-400 font-normal ml-1">(comma-separated, shown as tags)</span>
            </label>
            <input
              {...register('keywords')}
              className={inputClass(false)}
              placeholder="event insurance, wedding coverage, outdoor events"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
            <input
              {...register('img_path')}
              className={inputClass(false)}
              placeholder="https://…"
            />
          </div>

          {/* HTML Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
              <span className="text-gray-400 font-normal ml-1">(HTML)</span>
            </label>
            <textarea
              {...register('content')}
              rows={18}
              className={`${inputClass(false)} font-mono text-xs leading-relaxed`}
              placeholder="<p>Your post content here…</p>"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/admin/blog"
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || (!isNew && !isDirty)}
              className="bg-[#105778] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#0b3f57] transition disabled:opacity-50"
            >
              {isPending ? 'Saving…' : isNew ? 'Publish Post' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
