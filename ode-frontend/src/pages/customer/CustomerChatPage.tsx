import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  direction: 'in' | 'out'
  body: string
  created_at: string
}

interface MessagesResponse {
  lead_id: number | null
  is_blocked: boolean
  is_closed: boolean
  messages: ChatMessage[]
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerChatPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ['customer-messages'],
    queryFn: async () => (await api.get('/customer/messages')).data,
    refetchInterval: 5000,
  })

  const send = useMutation({
    mutationFn: async (body: string) => (await api.post('/customer/messages', { body })).data,
    onSuccess: () => {
      setDraft('')
      qc.invalidateQueries({ queryKey: ['customer-messages'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      toast.error(e.response?.data?.message ?? 'Could not send your message.')
    },
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages.length])

  const blocked = data?.is_blocked ?? false
  const messages = data?.messages ?? []

  const handleSend = () => {
    const body = draft.trim()
    if (!body || send.isPending || blocked) return
    send.mutate(body)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Support Chat</h1>
        <p className="text-sm text-gray-500">Message our team — we typically reply within one business day.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[420px]">

        {/* Banner states */}
        {blocked && (
          <div className="bg-red-50 border-b border-red-100 px-5 py-3 text-sm text-red-700">
            Chat is currently unavailable for your account. Please email{' '}
            <a href="mailto:support@onedayevent.com" className="font-semibold underline">support@onedayevent.com</a>.
          </div>
        )}
        {!blocked && data?.is_closed && (
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 text-sm text-amber-700">
            This conversation was marked resolved. Send a new message to reopen it.
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F7F9FC]">
          {isLoading ? (
            <div className="text-sm text-gray-400">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="w-14 h-14 rounded-full bg-[#105778]/10 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-[#105778]" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9C3.5 15 3 13.6 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm">No messages yet. Say hello — we're here to help!</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.direction === 'in' // customer's own messages
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-[13px] leading-relaxed ${
                      mine
                        ? 'bg-[#105778] text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-400'}`}>
                      {!mine && <span className="font-semibold">Support · </span>}
                      {clockTime(m.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 p-3 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            rows={1}
            disabled={blocked}
            placeholder={blocked ? 'Chat unavailable' : 'Type your message…  (Enter to send)'}
            className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#105778]/40 max-h-32 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || send.isPending || blocked}
            className="px-4 py-2 bg-[#105778] text-white text-sm font-semibold rounded-lg hover:bg-[#0c4258] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {send.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
