import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TemplateRow {
  id: number
  key: string
  subject: string
  is_active: boolean
  updated_at: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminEmailTemplatesPage() {
  const qc = useQueryClient()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [testingId, setTestingId]   = useState<number | null>(null)

  // ── Fetch list ──────────────────────────────────────────────────────────────

  const { data: templates = [], isLoading } = useQuery<TemplateRow[]>({
    queryKey: ['admin', 'email-templates'],
    queryFn: () => api.get('/admin/email-templates').then(r => r.data),
  })

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/email-templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted.')
      qc.invalidateQueries({ queryKey: ['admin', 'email-templates'] })
      setDeletingId(null)
    },
    onError: () => toast.error('Failed to delete template.'),
  })

  // ── Send test ───────────────────────────────────────────────────────────────

  const sendTestMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/email-templates/${id}/send-test`),
    onSuccess: (_data, id) => {
      toast.success('Test email sent to your inbox.')
      setTestingId(null)
      void id
    },
    onError: () => toast.error('Failed to send test email.'),
  })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Email Templates">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage transactional email templates. Variables use <code className="bg-gray-100 px-1 rounded">{'{variableName}'}</code> syntax.
          </p>
        </div>
        <Link
          to="/admin/email-templates/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + New Template
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg font-medium mb-1">No templates yet</p>
            <p className="text-sm">
              <Link to="/admin/email-templates/new" className="text-blue-600 hover:underline">
                Create your first template
              </Link>
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  {/* Key */}
                  <td className="px-6 py-4">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                      {t.key}
                    </code>
                  </td>

                  {/* Subject */}
                  <td className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate">{t.subject}</td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      t.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Send test */}
                      {testingId === t.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Send test?</span>
                          <button
                            onClick={() => sendTestMutation.mutate(t.id)}
                            disabled={sendTestMutation.isPending}
                            className="text-xs text-blue-600 font-medium hover:underline disabled:opacity-50"
                          >
                            {sendTestMutation.isPending ? 'Sending…' : 'Confirm'}
                          </button>
                          <button onClick={() => setTestingId(null)} className="text-xs text-gray-400 hover:underline">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setTestingId(t.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Send Test
                        </button>
                      )}

                      {/* Edit */}
                      <Link
                        to={`/admin/email-templates/${t.id}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </Link>

                      {/* Delete */}
                      {deletingId === t.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button
                            onClick={() => deleteMutation.mutate(t.id)}
                            disabled={deleteMutation.isPending}
                            className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? 'Deleting…' : 'Yes'}
                          </button>
                          <button onClick={() => setDeletingId(null)} className="text-xs text-gray-400 hover:underline">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(t.id)}
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
