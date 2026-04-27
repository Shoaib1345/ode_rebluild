import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateDetail {
  id: number
  key: string
  subject: string
  body: string
  variables: Array<{ name: string; description: string }>
  is_active: boolean
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const variableSchema = z.object({
  name:        z.string().min(1, 'Variable name required'),
  description: z.string().optional().or(z.literal('')),
})

const schema = z.object({
  key:       z.string()
               .min(1, 'Key is required')
               .regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case (lowercase letters, digits, underscores)'),
  subject:   z.string().min(1, 'Subject is required').max(191),
  body:      z.string().min(1, 'Body is required'),
  is_active: z.boolean(),
  variables: z.array(variableSchema),
})

type FormValues = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEmailTemplateEditPage() {
  const { id }   = useParams<{ id?: string }>()
  const isNew    = !id || id === 'new'
  const navigate = useNavigate()
  const qc       = useQueryClient()

  // ── Fetch existing template (edit mode only) ─────────────────────────────

  const { data: template, isLoading } = useQuery<TemplateDetail>({
    queryKey: ['admin', 'email-templates', id],
    queryFn:  () => api.get(`/admin/email-templates/${id}`).then(r => r.data),
    enabled:  !isNew,
  })

  // ── Form ─────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      key:       '',
      subject:   '',
      body:      '',
      is_active: true,
      variables: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variables' })

  // Populate form when editing existing template
  useEffect(() => {
    if (template) {
      reset({
        key:       template.key,
        subject:   template.subject,
        body:      template.body,
        is_active: template.is_active,
        variables: template.variables ?? [],
      })
    }
  }, [template, reset])

  // ── Extract variable tokens from body ────────────────────────────────────

  const bodyValue = watch('body')
  const bodyTokens: string[] = Array.from(
    new Set([...bodyValue.matchAll(/\{(\w+)\}/g)].map(m => m[1]))
  )

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => api.post('/admin/email-templates', data),
    onSuccess: () => {
      toast.success('Template created.')
      qc.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
      navigate('/admin/email-templates')
    },
    onError: () => toast.error('Failed to create template.'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => api.patch(`/admin/email-templates/${id}`, data),
    onSuccess: () => {
      toast.success('Template saved.')
      qc.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
      qc.invalidateQueries({ queryKey: ['admin', 'email-templates', id] })
      navigate('/admin/email-templates')
    },
    onError: () => toast.error('Failed to save template.'),
  })

  const sendTestMutation = useMutation({
    mutationFn: () => api.post(`/admin/email-templates/${id}/send-test`),
    onSuccess: (res) => toast.success(res.data.message ?? 'Test email sent.'),
    onError:   () => toast.error('Failed to send test email.'),
  })

  // ── Submit ───────────────────────────────────────────────────────────────

  function onSubmit(data: FormValues) {
    if (isNew) {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const apiError  = createMutation.error || updateMutation.error

  // ── Helpers ──────────────────────────────────────────────────────────────

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
      hasError ? 'border-red-400' : 'border-gray-300'
    }`

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <AdminLayout title="Email Templates">
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
    <AdminLayout title="Email Templates">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/admin/email-templates"
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? 'New Email Template' : 'Edit Email Template'}
            </h1>
            {!isNew && template && (
              <p className="text-sm text-gray-400 mt-0.5 font-mono">{template.key}</p>
            )}
          </div>

          {/* Send Test — only in edit mode */}
          {!isNew && (
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
              >
                {sendTestMutation.isPending ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>✉ Send Test</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Failed to save. Please check your inputs and try again.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Key ─────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Key <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(snake_case — cannot be changed after creation)</span>
            </label>
            <input
              {...register('key')}
              disabled={!isNew}
              placeholder="e.g. post_event_followup"
              className={`${inputClass(!!errors.key)} ${!isNew ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
            />
            {errors.key && <p className="mt-1 text-xs text-red-500">{errors.key.message}</p>}
          </div>

          {/* ── Subject ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              {...register('subject')}
              placeholder="e.g. Thanks for your event, {firstName}!"
              className={inputClass(!!errors.subject)}
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
          </div>

          {/* ── Active toggle ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
              <span className="ml-1 text-gray-400 font-normal">(inactive templates are never sent)</span>
            </label>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTML Body <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Use <code className="bg-gray-100 px-1 rounded">{'{variableName}'}</code> syntax for dynamic values.
            </p>
            <textarea
              {...register('body')}
              rows={14}
              placeholder={'<p>Hi {firstName},</p>\n<p>Thanks for booking your {eventType}!</p>'}
              className={`${inputClass(!!errors.body)} font-mono text-xs leading-relaxed`}
            />
            {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body.message}</p>}

            {/* Detected tokens */}
            {bodyTokens.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400">Detected variables:</span>
                {bodyTokens.map(tok => (
                  <span
                    key={tok}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-mono"
                  >
                    {'{' + tok + '}'}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Variables array ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Variable Definitions
                <span className="ml-1 text-gray-400 font-normal">(documents available tokens)</span>
              </label>
              <button
                type="button"
                onClick={() => append({ name: '', description: '' })}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add variable
              </button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No variables defined yet.</p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        {...register(`variables.${index}.name`)}
                        placeholder="variableName"
                        className={`${inputClass(!!errors.variables?.[index]?.name)} font-mono text-xs`}
                      />
                      {errors.variables?.[index]?.name && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors.variables[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-[2]">
                      <input
                        {...register(`variables.${index}.description`)}
                        placeholder="Description (optional)"
                        className={inputClass(false)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-1.5 text-gray-400 hover:text-red-500 transition"
                      aria-label="Remove variable"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link
              to="/admin/email-templates"
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
                  ? 'Create Template'
                  : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
