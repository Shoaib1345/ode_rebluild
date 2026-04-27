import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageDetail {
  id: number
  title: string
  slug: string
  navbar_text: string | null
  meta_keywords: string | null
  meta_description: string | null
  editor_content: string | null
  header_content: string | null
  sort_order: number
  add_to_menu: boolean
  status: number
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  title:            z.string().min(1, 'Title is required').max(191),
  slug:             z.string()
                     .min(1, 'Slug is required')
                     .max(191)
                     .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, digits and hyphens only'),
  navbar_text:      z.string().max(155).optional().or(z.literal('')),
  meta_keywords:    z.string().max(191).optional().or(z.literal('')),
  meta_description: z.string().max(191).optional().or(z.literal('')),
  editor_content:   z.string().optional().or(z.literal('')),
  header_content:   z.string().optional().or(z.literal('')),
  sort_order:       z.preprocess(v => Number(v), z.number().int().min(0)),
  add_to_menu:      z.boolean(),
  status:           z.preprocess(v => Number(v), z.union([z.literal(0), z.literal(1)])),
})

type FormValues = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPageEditPage() {
  const { id }   = useParams<{ id?: string }>()
  const isNew    = !id || id === 'new'
  const navigate = useNavigate()
  const qc       = useQueryClient()

  // ── Fetch existing page ──────────────────────────────────────────────────

  const { data: page, isLoading } = useQuery<PageDetail>({
    queryKey: ['admin', 'pages', id],
    queryFn:  () => api.get(`/admin/pages/${id}`).then(r => r.data),
    enabled:  !isNew,
  })

  // ── Form ─────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title:            '',
      slug:             '',
      navbar_text:      '',
      meta_keywords:    '',
      meta_description: '',
      editor_content:   '',
      header_content:   '',
      sort_order:       0,
      add_to_menu:      false,
      status:           1,
    },
  })

  // Auto-generate slug from title (new only)
  const titleValue = watch('title')
  useEffect(() => {
    if (isNew && titleValue) {
      const slug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', slug, { shouldValidate: false })
    }
  }, [titleValue, isNew, setValue])

  // Populate form when editing
  useEffect(() => {
    if (page) {
      reset({
        title:            page.title,
        slug:             page.slug,
        navbar_text:      page.navbar_text      ?? '',
        meta_keywords:    page.meta_keywords    ?? '',
        meta_description: page.meta_description ?? '',
        editor_content:   page.editor_content   ?? '',
        header_content:   page.header_content   ?? '',
        sort_order:       page.sort_order,
        add_to_menu:      page.add_to_menu,
        status:           (page.status === 1 ? 1 : 0) as 0 | 1,
      })
    }
  }, [page, reset])

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/admin/pages', data),
    onSuccess: () => {
      toast.success('Page created.')
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] })
      navigate('/admin/pages')
    },
    onError: () => toast.error('Failed to create page.'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => api.patch(`/admin/pages/${id}`, data),
    onSuccess: () => {
      toast.success('Page saved.')
      qc.invalidateQueries({ queryKey: ['admin', 'pages'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pages', id] })
      navigate('/admin/pages')
    },
    onError: () => toast.error('Failed to save page.'),
  })

  function onSubmit(data: FormValues) {
    if (isNew) createMutation.mutate(data)
    else        updateMutation.mutate(data)
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const apiError  = createMutation.error || updateMutation.error

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
      hasError ? 'border-red-400' : 'border-gray-300'
    }`

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <AdminLayout title="CMS Pages">
        <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </AdminLayout>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="CMS Pages">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin/pages"
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {isNew ? 'New Page' : 'Edit Page'}
          </h1>
          {!isNew && page && (
            <a
              href={`/pages/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-xs text-blue-600 hover:underline"
            >
              View live ↗
            </a>
          )}
        </div>

        {apiError && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to save. Please check your inputs and try again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Title + Slug ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register('title')}
                placeholder="About Us"
                className={inputClass(!!errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
                <span className="ml-1 text-gray-400 font-normal">(URL path)</span>
              </label>
              <input
                {...register('slug')}
                placeholder="about-us"
                className={inputClass(!!errors.slug)}
              />
              {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
            </div>
          </div>

          {/* ── Nav text + Sort Order + Toggles ─────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nav Label
                <span className="ml-1 text-gray-400 font-normal">(if in menu)</span>
              </label>
              <input
                {...register('navbar_text')}
                placeholder="About"
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                min={0}
                {...register('sort_order')}
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className={inputClass(false)}>
                <option value={1}>Published</option>
                <option value={0}>Draft</option>
              </select>
            </div>
          </div>

          {/* ── Toggles ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="add_to_menu"
              {...register('add_to_menu')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="add_to_menu" className="text-sm font-medium text-gray-700">
              Show in navigation menu
            </label>
          </div>

          {/* ── SEO ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider">SEO</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
              <input
                {...register('meta_keywords')}
                placeholder="event insurance, wedding, outdoor events"
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                {...register('meta_description')}
                rows={2}
                placeholder="Brief page description for search results…"
                className={inputClass(false)}
              />
            </div>
          </div>

          {/* ── Header content ───────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Header Content
              <span className="ml-1 text-gray-400 font-normal">(HTML — hero/banner area)</span>
            </label>
            <textarea
              {...register('header_content')}
              rows={4}
              placeholder="<h1>About One Day Event</h1>"
              className={`${inputClass(false)} font-mono text-xs`}
            />
          </div>

          {/* ── Main editor content ──────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Content
              <span className="ml-1 text-gray-400 font-normal">(HTML)</span>
            </label>
            <textarea
              {...register('editor_content')}
              rows={16}
              placeholder="<p>Page content here…</p>"
              className={`${inputClass(false)} font-mono text-xs leading-relaxed`}
            />
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link
              to="/admin/pages"
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || (!isNew && !isDirty)}
              className="bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isPending
                ? 'Saving…'
                : isNew
                  ? 'Create Page'
                  : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
