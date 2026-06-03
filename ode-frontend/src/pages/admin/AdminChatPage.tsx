import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LastMessage {
  body: string
  direction: 'in' | 'out'
  is_internal: boolean
  at: string
}

interface Conversation {
  lead_id: number
  name: string
  email: string | null
  event_name: string | null
  unread_count: number
  is_blocked: boolean
  is_closed: boolean
  last_message: LastMessage | null
  last_message_at: string | null
}

interface PaginatedConversations {
  data: Conversation[]
  total: number
}

interface ChatMessage {
  id: number
  direction: 'in' | 'out'
  body: string
  is_internal: boolean
  sender_id: number | null
  sender_name: string | null
  read_at: string | null
  created_at: string
}

interface LeadHeader {
  id: number
  name: string
  email: string | null
  phone: string | null
  event_name: string | null
  event_date: string | null
  is_blocked: boolean
  is_closed: boolean
}

interface ThreadResponse {
  lead: LeadHeader
  messages: ChatMessage[]
}

type StatusFilter = 'open' | 'closed' | 'all'

// ─── Canned replies ─────────────────────────────────────────────────────────────

const CANNED_REPLIES = [
  'Hi! Thanks for reaching out — how can we help with your event insurance today?',
  'Your Certificate of Insurance has been emailed to you. Please check your inbox (and spam folder).',
  'Could you please confirm your event date and venue so we can assist you further?',
  'Your policy is active — you can view and download your documents anytime from your customer portal.',
  'Thanks for your patience! A specialist will follow up with you shortly.',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [draft, setDraft] = useState('')
  const [internalMode, setInternalMode] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)

  const activeLeadId = params.get('lead') ? Number(params.get('lead')) : null
  const setActiveLeadId = (id: number) => setParams({ lead: String(id) })

  // Conversations list
  const { data: convData, isLoading: convLoading } = useQuery<PaginatedConversations>({
    queryKey: ['admin-chat-conversations', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/chat', {
        params: { search: search || undefined, status: statusFilter, per_page: 30 },
      })
      return res.data
    },
    refetchInterval: 10000,
  })

  const conversations = convData?.data ?? []

  useEffect(() => {
    if (activeLeadId === null && conversations.length > 0) {
      setActiveLeadId(conversations[0].lead_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, activeLeadId])

  // Active thread
  const { data: thread, isLoading: threadLoading } = useQuery<ThreadResponse>({
    queryKey: ['admin-chat-thread', activeLeadId],
    queryFn: async () => (await api.get(`/admin/chat/${activeLeadId}`)).data,
    enabled: activeLeadId !== null,
    refetchInterval: 5000,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-chat-thread', activeLeadId] })
    qc.invalidateQueries({ queryKey: ['admin-chat-conversations'] })
    qc.invalidateQueries({ queryKey: ['admin-chat-unread'] })
  }

  // Send reply / internal note
  const sendMutation = useMutation({
    mutationFn: async ({ body, isInternal }: { body: string; isInternal: boolean }) =>
      (await api.post(`/admin/chat/${activeLeadId}`, { body, is_internal: isInternal })).data,
    onSuccess: () => { setDraft(''); invalidateAll() },
    onError: () => toast.error('Could not send message.'),
  })

  // Block / close settings
  const settingsMutation = useMutation({
    mutationFn: async (patch: { is_blocked?: boolean; is_closed?: boolean }) =>
      (await api.patch(`/admin/chat/${activeLeadId}/settings`, patch)).data,
    onSuccess: (_data, patch) => {
      invalidateAll()
      if (patch.is_blocked !== undefined) toast.success(patch.is_blocked ? 'Chat blocked.' : 'Chat unblocked.')
      if (patch.is_closed !== undefined) toast.success(patch.is_closed ? 'Conversation closed.' : 'Conversation reopened.')
    },
    onError: () => toast.error('Could not update settings.'),
  })

  // Delete a message
  const deleteMutation = useMutation({
    mutationFn: async (messageId: number) => api.delete(`/admin/chat/${activeLeadId}/messages/${messageId}`),
    onSuccess: () => { invalidateAll(); toast.success('Message deleted.') },
    onError: () => toast.error('Could not delete message.'),
  })

  useEffect(() => {
    if (thread) {
      qc.invalidateQueries({ queryKey: ['admin-chat-conversations'] })
      qc.invalidateQueries({ queryKey: ['admin-chat-unread'] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.messages.length])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages.length, activeLeadId])

  const handleSend = () => {
    const body = draft.trim()
    if (!body || sendMutation.isPending) return
    sendMutation.mutate({ body, isInternal: internalMode })
  }

  const lead = thread?.lead

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">Customer Chat</h1>
        <p className="text-sm text-gray-500">Support conversations with leads &amp; customers.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex h-[calc(100vh-200px)] min-h-[480px]">

        {/* ── Conversation list ──────────────────────────────────────────── */}
        <div className="w-[300px] border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/40"
            />
            <div className="flex gap-1">
              {(['open', 'closed', 'all'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition-colors ${
                    statusFilter === s ? 'bg-[#1CA0DF] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="p-4 text-sm text-gray-400">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No conversations.</div>
            ) : (
              conversations.map((c) => {
                const active = c.lead_id === activeLeadId
                return (
                  <button
                    key={c.lead_id}
                    onClick={() => setActiveLeadId(c.lead_id)}
                    className={`w-full text-left px-3 py-3 border-b border-gray-50 flex gap-3 transition-colors ${
                      active ? 'bg-[#E8F4FD]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1CA0DF] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] truncate ${c.unread_count > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {c.name}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-[12px] truncate ${c.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {c.last_message
                            ? (c.last_message.is_internal ? '📝 ' : c.last_message.direction === 'out' ? 'You: ' : '') + c.last_message.body
                            : 'No messages'}
                        </p>
                        {c.unread_count > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-[#E0232C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      {(c.is_blocked || c.is_closed) && (
                        <div className="flex gap-1 mt-1">
                          {c.is_blocked && <span className="text-[9px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Blocked</span>}
                          {c.is_closed && <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Closed</span>}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Thread ─────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeLeadId === null ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              Select a conversation to start chatting.
            </div>
          ) : (
            <>
              {/* Header + moderation controls */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-[#1CA0DF] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials(lead?.name ?? '?')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-2">
                    {lead?.name ?? '…'}
                    {lead?.is_blocked && <span className="text-[9px] font-bold uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Blocked</span>}
                    {lead?.is_closed && <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Closed</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {lead?.email}{lead?.event_name ? ` · ${lead.event_name}` : ''}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => settingsMutation.mutate({ is_closed: !lead?.is_closed })}
                    disabled={settingsMutation.isPending}
                    className="text-[12px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {lead?.is_closed ? 'Reopen' : 'Close'}
                  </button>
                  <button
                    onClick={() => settingsMutation.mutate({ is_blocked: !lead?.is_blocked })}
                    disabled={settingsMutation.isPending}
                    className={`text-[12px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      lead?.is_blocked
                        ? 'border-green-200 text-green-700 hover:bg-green-50'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {lead?.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                  {lead?.id && (
                    <a href={`/admin/leads/${lead.id}`} className="text-[12px] text-[#1CA0DF] font-medium hover:underline flex-shrink-0">
                      View lead →
                    </a>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F7F9FC]">
                {threadLoading ? (
                  <div className="text-sm text-gray-400">Loading messages…</div>
                ) : thread && thread.messages.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center mt-8">No messages yet.</div>
                ) : (
                  thread?.messages.map((m) => {
                    const out = m.direction === 'out'

                    if (m.is_internal) {
                      return (
                        <div key={m.id} className="flex justify-center group">
                          <div className="max-w-[80%] rounded-lg px-3 py-2 text-[12px] bg-amber-50 border border-amber-200 text-amber-900">
                            <div className="flex items-center justify-between gap-3 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600">📝 Internal note · only your team</span>
                              <button
                                onClick={() => { if (confirm('Delete this note?')) deleteMutation.mutate(m.id) }}
                                className="opacity-0 group-hover:opacity-100 text-amber-500 hover:text-red-600 transition"
                                title="Delete note"
                              >✕</button>
                            </div>
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className="text-[10px] mt-1 text-amber-500">{m.sender_name} · {clockTime(m.created_at)}</p>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={m.id} className={`flex group ${out ? 'justify-end' : 'justify-start'}`}>
                        {out && (
                          <button
                            onClick={() => { if (confirm('Delete this message?')) deleteMutation.mutate(m.id) }}
                            className="opacity-0 group-hover:opacity-100 self-center mr-1.5 text-gray-300 hover:text-red-500 transition text-xs"
                            title="Delete message"
                          >🗑</button>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-[13px] leading-relaxed ${
                          out ? 'bg-[#1CA0DF] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`text-[10px] mt-1 ${out ? 'text-white/70' : 'text-gray-400'}`}>
                            {out && m.sender_name ? `${m.sender_name} · ` : ''}{clockTime(m.created_at)}
                          </p>
                        </div>
                        {!out && (
                          <button
                            onClick={() => { if (confirm('Delete this message?')) deleteMutation.mutate(m.id) }}
                            className="opacity-0 group-hover:opacity-100 self-center ml-1.5 text-gray-300 hover:text-red-500 transition text-xs"
                            title="Delete message"
                          >🗑</button>
                        )}
                      </div>
                    )
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-gray-100 p-3 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setDraft(e.target.value) }}
                    className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]/40 max-w-[200px]"
                  >
                    <option value="">Insert canned reply…</option>
                    {CANNED_REPLIES.map((r, i) => (
                      <option key={i} value={r}>{r.length > 45 ? r.slice(0, 45) + '…' : r}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={internalMode} onChange={(e) => setInternalMode(e.target.checked)} className="accent-amber-500" />
                    Internal note (hidden from customer)
                  </label>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    rows={1}
                    placeholder={internalMode ? 'Write an internal note…' : 'Type a reply…  (Enter to send)'}
                    className={`flex-1 resize-none px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 max-h-32 ${
                      internalMode ? 'border-amber-300 bg-amber-50 focus:ring-amber-300' : 'border-gray-200 focus:ring-[#1CA0DF]/40'
                    }`}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sendMutation.isPending}
                    className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 ${
                      internalMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1CA0DF] hover:bg-[#1790c8]'
                    }`}
                  >
                    {sendMutation.isPending ? 'Sending…' : internalMode ? 'Add note' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
