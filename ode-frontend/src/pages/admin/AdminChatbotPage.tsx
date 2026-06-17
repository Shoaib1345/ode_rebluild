import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QaEntry {
  id: number
  keywords: string
  answer: string
  sort_order: number
  created_at: string | null
}

type ApiError = { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }

const SAMPLE_CSV = `keywords,answer
refund|cancel policy,"Refunds are handled case-by-case — contact support@onedayevent.com."
discount|coupon|promo,"We occasionally run promotions. Get an instant quote to see current pricing."`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminChatbotPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [keywords, setKeywords] = useState('')
  const [answer, setAnswer]     = useState('')
  const [file, setFile]         = useState<File | null>(null)
  const [replace, setReplace]   = useState(false)

  const { data: entries, isLoading } = useQuery<QaEntry[]>({
    queryKey: ['admin-chatbot-qa'],
    queryFn: async () => (await api.get('/admin/chatbot/qa')).data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-chatbot-qa'] })

  const addMut = useMutation({
    mutationFn: async () => (await api.post('/admin/chatbot/qa', { keywords, answer })).data,
    onSuccess: () => { setKeywords(''); setAnswer(''); invalidate(); toast.success('Entry added.') },
    onError: (e) => toast.error((e as ApiError).response?.data?.message ?? 'Could not add entry.'),
  })

  const importMut = useMutation({
    mutationFn: async () => {
      const csv = await file!.text()
      return (await api.post('/admin/chatbot/qa/import', { csv, replace })).data
    },
    onSuccess: (data: { message?: string }) => {
      setFile(null); if (fileRef.current) fileRef.current.value = ''
      setReplace(false); invalidate()
      toast.success(data?.message ?? 'CSV imported.')
    },
    onError: (e) => toast.error((e as ApiError).response?.data?.message ?? 'Import failed. Check the CSV format.'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/chatbot/qa/${id}`),
    onSuccess: () => { invalidate(); toast.success('Entry deleted.') },
    onError: () => toast.error('Could not delete entry.'),
  })

  const clearMut = useMutation({
    mutationFn: async () => api.delete('/admin/chatbot/qa'),
    onSuccess: () => { invalidate(); toast.success('All custom entries cleared.') },
    onError: () => toast.error('Could not clear entries.'),
  })

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'chatbot-qa-sample.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Chatbot Q&amp;A</h1>
        <p className="text-sm text-gray-500">
          Manage the answers your website chatbot gives. These are layered on top of the built-in
          answers (which always work) — your entries take priority.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Add + Import ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Add single */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (keywords.trim() && answer.trim()) addMut.mutate() }}
            className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4"
          >
            <h2 className="text-base font-semibold text-gray-800">Add an answer</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trigger keywords</label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="refund | cancel | money back"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
              />
              <p className="text-[11px] text-gray-400 mt-1">Separate alternative phrases with <code>|</code>. If the visitor's message contains any, this answer fires.</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Answer</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                placeholder="Refunds are handled case-by-case — contact support@onedayevent.com."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={addMut.isPending || !keywords.trim() || !answer.trim()}
              className="px-5 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {addMut.isPending ? 'Adding…' : 'Add answer'}
            </button>
          </form>

          {/* Import CSV */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Import from CSV</h2>
              <button onClick={downloadSample} className="text-[12px] text-[#1CA0DF] font-medium hover:underline">
                Download sample
              </button>
            </div>
            <p className="text-[12px] text-gray-500">
              CSV with a header row, then <code>keywords,answer</code> per line. Separate alternative
              keywords with <code>|</code>. Wrap answers containing commas in double quotes.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E8F4FD] file:text-[#1CA0DF] hover:file:bg-[#d7ecfb]"
            />
            <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="accent-[#1CA0DF]" />
              Replace all existing custom entries
            </label>
            <button
              onClick={() => importMut.mutate()}
              disabled={!file || importMut.isPending}
              className="px-5 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {importMut.isPending ? 'Importing…' : 'Import CSV'}
            </button>
          </div>
        </div>

        {/* ── Existing entries ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Custom answers {entries ? <span className="text-gray-400 font-normal">({entries.length})</span> : null}
            </h2>
            {entries && entries.length > 0 && (
              <button
                onClick={() => { if (confirm('Delete ALL custom chatbot answers? Built-in answers stay active.')) clearMut.mutate() }}
                className="text-[12px] text-red-600 font-medium hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>
            ) : !entries || entries.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No custom answers yet. The chatbot still uses its built-in answers.
              </div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {e.keywords.split('|').map((k) => k.trim()).filter(Boolean).map((k, i) => (
                        <span key={i} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{k}</span>
                      ))}
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{e.answer}</p>
                  </div>
                  <button
                    onClick={() => deleteMut.mutate(e.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    title="Delete"
                    aria-label="Delete entry"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
