import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id: number
  message: string
  created_at: string
  author: { id: number; first_name: string; last_name: string } | null
}

interface LeadDetail {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  event_type_label: string | null
  event_date: string | null
  event_state: string | null
  event_name: string | null
  no_of_people: number | null
  alcohol_served: string | null
  carrier: string | null
  coverage_limit: string | null
  submission_status: string
  is_on_hold: boolean
  bound: boolean
  lead_offered_plans: {
    carrier: string
    premium: number
    broker_fee: number
    processing_fee: number
    total: number
  } | null
  ins_first_name: string | null
  ins_last_name: string | null
  ins_street: string | null
  ins_city: string | null
  ins_state: string | null
  ins_zip: string | null
  venue_name: string | null
  venue_address: string | null
  venue_state: string | null
  created_at: string
  notes: Note[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'tried',               label: 'Started' },
  { value: 'saved',               label: 'Saved' },
  { value: 'mq',                  label: 'Manual Quote' },
  { value: 'plan_added_manually', label: 'Plan Added' },
  { value: 'payment',             label: 'Awaiting Payment' },
  { value: 'payment_received',    label: 'Paid' },
  { value: 'finished',            label: 'Finished' },
]

const STATUS_BADGE: Record<string, string> = {
  tried:                'bg-gray-100 text-gray-600',
  saved:                'bg-yellow-100 text-yellow-700',
  mq:                   'bg-orange-100 text-orange-700',
  plan_added_manually:  'bg-purple-100 text-purple-700',
  payment:              'bg-blue-100 text-blue-700',
  payment_received:     'bg-green-100 text-green-700',
  finished:             'bg-green-200 text-green-800',
}

const STATUS_LABELS: Record<string, string> = {
  tried:                'Started',
  saved:                'Saved',
  mq:                   'Manual Quote',
  plan_added_manually:  'Plan Added',
  payment:              'Awaiting Payment',
  payment_received:     'Paid',
  finished:             'Finished',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateTime(str: string) {
  return new Date(str).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function val(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentLeadDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [noteText, setNoteText] = useState('')

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['agent-lead', id],
    queryFn:  () => api.get<LeadDetail>(`/agent/leads/${id}`).then(r => r.data),
    enabled:  !!id,
    retry:    (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      return status !== 404 && count < 2
    },
  })

  // ── Patch (status + on_hold) ─────────────────────────────────────────────
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch(`/agent/leads/${id}`, body).then(r => r.data as LeadDetail),
    onSuccess: (updated) => {
      queryClient.setQueryData(['agent-lead', id], updated)
      queryClient.invalidateQueries({ queryKey: ['agent-leads'] })
      queryClient.invalidateQueries({ queryKey: ['agent-dashboard'] })
      toast.success('Lead updated.')
    },
    onError: () => toast.error('Update failed.'),
  })

  // ── Add note ─────────────────────────────────────────────────────────────
  const addNote = useMutation({
    mutationFn: (message: string) =>
      api.post(`/agent/leads/${id}/notes`, { message }).then(r => r.data as Note),
    onSuccess: (note) => {
      queryClient.setQueryData(['agent-lead', id], (old: LeadDetail | undefined) =>
        old ? { ...old, notes: [note, ...old.notes] } : old
      )
      setNoteText('')
      toast.success('Note added.')
    },
    onError: () => toast.error('Failed to add note.'),
  })

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-5 animate-pulse">
            <div className="h-4 w-32 bg-gray-100 rounded mb-4"/>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="h-3 bg-gray-100 rounded w-3/4"/>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError || !lead) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
        <p className="text-sm text-gray-500 mb-3">Lead not found or you don't have access.</p>
        <button
          onClick={() => navigate('/agent/leads')}
          className="text-sm text-[#1CA0DF] hover:underline"
        >
          ← Back to my leads
        </button>
      </div>
    )
  }

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'

  return (
    <div className="space-y-5">

      {/* ── Back + Header ──────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/agent/leads')}
          className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1"
        >
          ← Back to my leads
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.submission_status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[lead.submission_status] ?? lead.submission_status}
          </span>
          {lead.is_on_hold && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              ⏸ On Hold
            </span>
          )}
          {lead.bound && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              Bound
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Lead #{lead.id} · Added {fmtDateTime(lead.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contact */}
          <Section title="Contact Information">
            <Row label="Full Name"  value={fullName} />
            <Row label="Email"      value={val(lead.email)} />
            <Row label="Phone"      value={val(lead.phone)} />
          </Section>

          {/* Event */}
          <Section title="Event Details">
            <Row label="Event Name"   value={val(lead.event_name)} />
            <Row label="Event Type"   value={val(lead.event_type_label)} />
            <Row label="Event Date"   value={fmtDate(lead.event_date)} />
            <Row label="State"        value={val(lead.event_state)} />
            <Row label="Guests"       value={val(lead.no_of_people)} />
            <Row label="Alcohol"      value={val(lead.alcohol_served)} />
          </Section>

          {/* Policy */}
          {lead.lead_offered_plans && (
            <Section title="Policy / Coverage">
              <Row label="Carrier"     value={val(lead.lead_offered_plans.carrier)} />
              <Row label="Coverage"    value={val(lead.coverage_limit)} />
              <Row label="Premium"     value={`$${lead.lead_offered_plans.premium.toFixed(2)}`} />
              <Row label="Broker Fee"  value={`$${lead.lead_offered_plans.broker_fee.toFixed(2)}`} />
              <Row label="Total"       value={`$${lead.lead_offered_plans.total.toFixed(2)}`} />
            </Section>
          )}

          {/* Insured */}
          {(lead.ins_first_name || lead.ins_street) && (
            <Section title="Insured Address">
              <Row label="Name"    value={[lead.ins_first_name, lead.ins_last_name].filter(Boolean).join(' ') || '—'} />
              <Row label="Street"  value={val(lead.ins_street)} />
              <Row label="City"    value={val(lead.ins_city)} />
              <Row label="State"   value={val(lead.ins_state)} />
              <Row label="Zip"     value={val(lead.ins_zip)} />
            </Section>
          )}

          {/* Venue */}
          {lead.venue_name && (
            <Section title="Venue">
              <Row label="Name"     value={val(lead.venue_name)} />
              <Row label="Address"  value={val(lead.venue_address)} />
              <Row label="State"    value={val(lead.venue_state)} />
            </Section>
          )}

          {/* Notes */}
          <Section title="Notes">
            {/* Add note form */}
            <div className="mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  disabled={!noteText.trim() || addNote.isPending}
                  onClick={() => addNote.mutate(noteText.trim())}
                  className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addNote.isPending ? 'Adding…' : 'Add Note'}
                </button>
              </div>
            </div>

            {/* Notes list */}
            {lead.notes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {lead.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {note.author
                          ? `${note.author.first_name} ${note.author.last_name}`
                          : 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* ── Right column: Update panel ──────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
              Update Lead
            </h2>

            {/* Status select */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Submission Status</label>
              <select
                value={lead.submission_status}
                disabled={patch.isPending}
                onChange={(e) => patch.mutate({ submission_status: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] disabled:opacity-50"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* On hold toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">On Hold</span>
              <button
                type="button"
                role="switch"
                aria-checked={lead.is_on_hold}
                disabled={patch.isPending}
                onClick={() => patch.mutate({ is_on_hold: !lead.is_on_hold })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                  lead.is_on_hold ? 'bg-red-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    lead.is_on_hold ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {patch.isPending && (
              <p className="text-xs text-gray-400 mt-2">Saving…</p>
            )}
          </div>

          {/* Quick summary card */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
              Quick Summary
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-400">Carrier</dt>
                <dd className="text-sm text-gray-700">{val(lead.carrier)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Coverage Limit</dt>
                <dd className="text-sm text-gray-700">{val(lead.coverage_limit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Event Date</dt>
                <dd className="text-sm text-gray-700">{fmtDate(lead.event_date)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">State</dt>
                <dd className="text-sm text-gray-700">{val(lead.event_state)}</dd>
              </div>
            </dl>
          </div>
        </div>

      </div>
    </div>
  )
}
