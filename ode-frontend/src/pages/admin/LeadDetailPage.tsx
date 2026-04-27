import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

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
  bound: boolean
  is_on_hold: boolean
  is_priority_lead: boolean
  closing_reason: string | null
  payment_id: string | null
  payment_status: number
  lead_offered_plans: {
    rate_id: number
    carrier: string
    premium: number
    broker_fee: number
    processing_fee: number
    extra_charge: number
    total: number
    min_limit: number
    max_limit: number
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
  venue_zip: string | null
  contact_at_venue: string | null
  venue_contact_email: string | null
  venue_contact_number: string | null
  waiver_sub_status: boolean
  hired_status: boolean
  primary_basis: boolean
  additional_insured: string | null
  user_timezone: string | null
  created_at: string
  notes: Note[]
  policy_pdf_path: string | null
  receipt_pdf_path: string | null
  coi_pdf_path: string | null
}

interface DocuSignStatus {
  envelope_id: string | null
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided' | null
  sent_at: string | null
  signed_at: string | null
}

interface Assignee {
  id: number
  first_name: string
  last_name: string
  email: string
  role_name: string | null
}

interface AssignableUser {
  id: number
  first_name: string
  last_name: string
  email: string
  role_name: string | null
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
  payment:              'bg-[#EDF0FA] text-[#105778]',
  payment_received:     'bg-green-100 text-green-700',
  finished:             'bg-green-200 text-green-800',
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

function val(v: string | number | null | undefined, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
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

function Toggle({
  label,
  checked,
  onChange,
  loading,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  loading: boolean
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={loading}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          checked ? 'bg-[#1CA0DF]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}

// ─── Data fetchers / mutators ─────────────────────────────────────────────────

async function fetchLead(id: string): Promise<LeadDetail> {
  const res = await api.get<LeadDetail>(`/admin/leads/${id}`)
  return res.data
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const [noteText,   setNoteText]   = useState('')
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['admin-lead', id],
    queryFn:  () => fetchLead(id!),
    enabled:  !!id,
  })

  // ── Patch mutation (status / flags) ─────────────────────────────────────
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch(`/admin/leads/${id}`, body).then((r) => r.data as LeadDetail),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-lead', id], updated)
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
    },
  })

  // ── Add note mutation ────────────────────────────────────────────────────
  const addNote = useMutation({
    mutationFn: (message: string) =>
      api.post<Note>(`/admin/leads/${id}/notes`, { message }).then((r) => r.data),
    onSuccess: (note) => {
      queryClient.setQueryData<LeadDetail>(['admin-lead', id], (old) =>
        old ? { ...old, notes: [note, ...old.notes] } : old
      )
      setNoteText('')
    },
  })

  // ── DocuSign status query ────────────────────────────────────────────────
  const { data: docuSign, refetch: refetchDocuSign } = useQuery<DocuSignStatus>({
    queryKey: ['admin-lead-docusign', id],
    queryFn:  () => api.get(`/admin/leads/${id}/docusign/status`).then(r => r.data),
    enabled:  !!id,
    refetchInterval: (q) => {
      const status = q.state.data?.status
      // Poll every 30s while pending (sent/delivered)
      return (status === 'sent' || status === 'delivered') ? 30_000 : false
    },
  })

  // ── PDF status ───────────────────────────────────────────────────────────
  interface PdfStatus { policy_pdf_path: string | null; receipt_pdf_path: string | null; coi_pdf_path: string | null }
  const { data: pdfStatus, refetch: refetchPdf } = useQuery<PdfStatus>({
    queryKey: ['admin-lead-pdfs', id],
    queryFn:  () => api.get(`/admin/leads/${id}/pdf-status`).then(r => r.data),
    enabled:  !!id,
  })

  const generatePdf = useMutation({
    mutationFn: (type: 'policy' | 'coi') =>
      api.post(`/admin/leads/${id}/generate-pdf${type === 'coi' ? '/coi' : ''}`),
    onSuccess: (_d, type) => {
      toast.success(type === 'coi' ? 'COI queued.' : 'Policy & receipt queued.')
      // Poll after a moment since QUEUE_CONNECTION=sync locally it's instant
      setTimeout(() => void refetchPdf(), 500)
    },
    onError: () => toast.error('PDF generation failed.'),
  })

  // ── Assignment ───────────────────────────────────────────────────────────
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('')

  const { data: assignments, refetch: refetchAssignments } = useQuery<{ assignees: Assignee[] }>({
    queryKey: ['admin-lead-assignments', id],
    queryFn:  () => api.get(`/admin/leads/${id}/assignments`).then(r => r.data),
    enabled:  !!id,
  })

  const { data: assignableUsers = [] } = useQuery<AssignableUser[]>({
    queryKey: ['admin-assignable-users'],
    queryFn:  () => api.get('/admin/assignable-users').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const assignUser = useMutation({
    mutationFn: (userId: number) =>
      api.post(`/admin/leads/${id}/assignments`, { user_id: userId }).then(r => r.data),
    onSuccess: () => {
      toast.success('Agent assigned.')
      setSelectedUserId('')
      void refetchAssignments()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to assign.')
    },
  })

  const unassignUser = useMutation({
    mutationFn: (userId: number) =>
      api.delete(`/admin/leads/${id}/assignments/${userId}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Agent removed.')
      void refetchAssignments()
    },
    onError: () => toast.error('Failed to remove assignment.'),
  })

  // Users not yet assigned — filter the dropdown
  const assignedIds = useMemo(
    () => new Set((assignments?.assignees ?? []).map(a => a.id)),
    [assignments]
  )
  const unassignedUsers = useMemo(
    () => assignableUsers.filter(u => !assignedIds.has(u.id)),
    [assignableUsers, assignedIds]
  )

  // ── DocuSign send / resend ───────────────────────────────────────────────
  const sendEnvelope = useMutation({
    mutationFn: () => api.post(`/admin/leads/${id}/docusign/send`),
    onSuccess: () => {
      toast.success('Envelope sent for signature.')
      void refetchDocuSign()
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to send envelope.')
    },
  })

  // ── Loading / error states ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-40 bg-gray-100 rounded-xl" />
        </div>
      </AdminLayout>
    )
  }

  if (isError || !lead) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
          Lead not found.{' '}
          <button onClick={() => navigate('/admin/leads')} className="underline">
            Back to leads
          </button>
        </div>
      </AdminLayout>
    )
  }

  const plan = lead.lead_offered_plans

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/leads')}
              className="text-xs text-[#1CA0DF] hover:text-[#105778] mb-1 block"
            >
              ← Back to leads
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed Lead'}
              {lead.is_priority_lead && (
                <span className="ml-2 text-amber-500 text-lg" title="Priority lead">★</span>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.submission_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUSES.find((s) => s.value === lead.submission_status)?.label ?? lead.submission_status}
              </span>
              {lead.bound && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Bound
                </span>
              )}
              {lead.is_on_hold && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  On Hold
                </span>
              )}
              <span className="text-xs text-gray-400">#{lead.id} · Created {fmtDateTime(lead.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left col (2/3) ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact */}
            <Section title="Contact information">
              <Row label="Name"  value={val(`${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim())} />
              <Row label="Email" value={lead.email
                ? <a href={`mailto:${lead.email}`} className="text-[#1CA0DF] hover:underline">{lead.email}</a>
                : '—'} />
              <Row label="Phone" value={val(lead.phone)} />
              <Row label="Timezone" value={val(lead.user_timezone)} />
            </Section>

            {/* Insured party */}
            <Section title="Named insured">
              <Row label="Name"    value={val(`${lead.ins_first_name ?? ''} ${lead.ins_last_name ?? ''}`.trim())} />
              <Row label="Address" value={val(lead.ins_street)} />
              <Row label="City / State / Zip" value={[lead.ins_city, lead.ins_state, lead.ins_zip].filter(Boolean).join(', ') || '—'} />
            </Section>

            {/* Event & venue */}
            <Section title="Event & venue">
              <Row label="Event name"   value={val(lead.event_name)} />
              <Row label="Event type"   value={val(lead.event_type_label)} />
              <Row label="Event date"   value={fmtDate(lead.event_date)} />
              <Row label="State"        value={val(lead.event_state)} />
              <Row label="Guests"       value={val(lead.no_of_people)} />
              <Row label="Alcohol"      value={val(lead.alcohol_served)} />
              <Row label="Waiver sub"   value={lead.waiver_sub_status ? 'Yes' : 'No'} />
              <Row label="Hired / NOHA" value={lead.hired_status ? 'Yes' : 'No'} />
              <Row label="Primary basis"value={lead.primary_basis ? 'Yes' : 'No'} />
              <Row label="Add'l insured"value={val(lead.additional_insured)} />
              <hr className="my-2 border-gray-100" />
              <Row label="Venue"        value={val(lead.venue_name)} />
              <Row label="Venue address"value={[lead.venue_address, lead.venue_state, lead.venue_zip].filter(Boolean).join(', ') || '—'} />
              <Row label="Venue contact"value={val(lead.contact_at_venue)} />
              <Row label="Venue phone"  value={val(lead.venue_contact_number)} />
              <Row label="Venue email"  value={val(lead.venue_contact_email)} />
            </Section>

            {/* Plan / payment */}
            {plan && (
              <Section title="Plan & payment">
                <Row label="Carrier"        value={val(plan.carrier)} />
                <Row label="Coverage"       value={`${plan.min_limit}M / ${plan.max_limit}M`} />
                <Row label="Premium"        value={`$${plan.premium.toFixed(2)}`} />
                <Row label="Broker fee"     value={`$${plan.broker_fee.toFixed(2)}`} />
                <Row label="Processing fee" value={`$${plan.processing_fee.toFixed(2)}`} />
                {plan.extra_charge > 0 && (
                  <Row label="Extra charge" value={`$${plan.extra_charge.toFixed(2)}`} />
                )}
                <Row label="Total charged"  value={<span className="font-semibold text-[#105778]">${plan.total.toFixed(2)}</span>} />
                <Row label="Stripe ID"      value={<span className="font-mono text-xs">{val(lead.payment_id)}</span>} />
              </Section>
            )}

            {/* Notes */}
            <Section title="Notes">
              {/* Add note form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (noteText.trim()) addNote.mutate(noteText.trim())
                }}
                className="mb-5"
              >
                <textarea
                  ref={noteRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Add a note…"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] resize-none"
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="submit"
                    disabled={!noteText.trim() || addNote.isPending}
                    className="px-4 py-1.5 text-sm bg-[#1CA0DF] hover:bg-[#1786BB] text-white rounded-lg transition-colors disabled:opacity-40"
                  >
                    {addNote.isPending ? 'Saving…' : 'Add note'}
                  </button>
                </div>
                {addNote.isError && (
                  <p className="text-xs text-red-600 mt-1">Failed to save note. Try again.</p>
                )}
              </form>

              {/* Note list */}
              {lead.notes.length === 0 ? (
                <p className="text-xs text-gray-400">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-600">
                          {note.author
                            ? `${note.author.first_name} ${note.author.last_name}`
                            : 'Staff'}
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

          {/* ── Right col (1/3) — CRM controls ──────────────────────── */}
          <div className="space-y-5">

            <Section title="Status">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Submission status</label>
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

                <div className="divide-y divide-gray-100">
                  <Toggle
                    label="Bound"
                    checked={lead.bound}
                    loading={patch.isPending}
                    onChange={(v) => patch.mutate({ bound: v })}
                  />
                  <Toggle
                    label="On hold"
                    checked={lead.is_on_hold}
                    loading={patch.isPending}
                    onChange={(v) => patch.mutate({ is_on_hold: v })}
                  />
                  <Toggle
                    label="Priority lead"
                    checked={lead.is_priority_lead}
                    loading={patch.isPending}
                    onChange={(v) => patch.mutate({ is_priority_lead: v })}
                  />
                </div>

                {patch.isError && (
                  <p className="text-xs text-red-600">Update failed. Try again.</p>
                )}
              </div>
            </Section>

            <Section title="Closing reason">
              <textarea
                key={lead.closing_reason ?? ''}
                defaultValue={lead.closing_reason ?? ''}
                rows={3}
                placeholder="Optional — reason for closing"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] resize-none"
                onBlur={(e) => {
                  const val = e.target.value.trim()
                  if (val !== (lead.closing_reason ?? '')) {
                    patch.mutate({ closing_reason: val || null })
                  }
                }}
              />
            </Section>

            <Section title="Quick info">
              <Row label="Lead #"   value={`#${lead.id}`} />
              <Row label="Created"  value={fmtDateTime(lead.created_at)} />
              <Row label="Carrier"  value={val(lead.carrier)} />
              <Row label="Coverage" value={val(lead.coverage_limit)} />
            </Section>

            {/* ── PDFs ─────────────────────────────────────────────── */}
            <Section title="Documents">
              <div className="space-y-2">
                {/* Policy PDF */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Policy PDF</span>
                  {pdfStatus?.policy_pdf_path ? (
                    <a
                      href={`/api/files/policies/${lead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ↓ Download
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not generated</span>
                  )}
                </div>

                {/* Receipt PDF */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Receipt PDF</span>
                  {pdfStatus?.receipt_pdf_path ? (
                    <a
                      href={`/api/files/receipts/${lead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ↓ Download
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not generated</span>
                  )}
                </div>

                {/* COI PDF */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Certificate of Insurance</span>
                  {pdfStatus?.coi_pdf_path ? (
                    <a
                      href={`/api/files/cois/${lead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ↓ Download
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Not generated</span>
                  )}
                </div>
              </div>

              {/* Generate buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => generatePdf.mutate('policy')}
                  disabled={generatePdf.isPending}
                  className="flex-1 text-xs bg-[#105778] text-white px-3 py-1.5 rounded-lg hover:bg-[#0b3f57] transition disabled:opacity-50"
                >
                  {generatePdf.isPending ? '…' : 'Generate Policy'}
                </button>
                <button
                  onClick={() => generatePdf.mutate('coi')}
                  disabled={generatePdf.isPending}
                  className="flex-1 text-xs border border-[#105778] text-[#105778] px-3 py-1.5 rounded-lg hover:bg-[#105778]/5 transition disabled:opacity-50"
                >
                  Gen. COI
                </button>
              </div>
            </Section>

            {/* ── Assignment ───────────────────────────────────────── */}
            <Section title="Assigned agents">
              {/* Current assignees */}
              {(assignments?.assignees ?? []).length === 0 ? (
                <p className="text-xs text-gray-400 mb-3">No one assigned yet.</p>
              ) : (
                <ul className="space-y-2 mb-3">
                  {(assignments?.assignees ?? []).map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {a.first_name} {a.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{a.role_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => unassignUser.mutate(a.id)}
                        disabled={unassignUser.isPending}
                        title="Remove assignment"
                        className="ml-2 shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add assignment */}
              {unassignedUsers.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-2 py-1.5
                      focus:outline-none focus:ring-2 focus:ring-[#1CA0DF] bg-white"
                  >
                    <option value="">Pick a person…</option>
                    {unassignedUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.role_name})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUserId !== '') assignUser.mutate(selectedUserId as number)
                    }}
                    disabled={selectedUserId === '' || assignUser.isPending}
                    className="shrink-0 px-3 py-1.5 text-sm bg-[#1CA0DF] hover:bg-[#1786BB] text-white
                      rounded-lg transition-colors disabled:opacity-40"
                  >
                    {assignUser.isPending ? '…' : 'Assign'}
                  </button>
                </div>
              )}

              {unassignedUsers.length === 0 && (assignments?.assignees ?? []).length > 0 && (
                <p className="text-xs text-gray-400 mt-1">All available agents assigned.</p>
              )}
            </Section>

            {/* ── DocuSign ─────────────────────────────────────────── */}
            <Section title="E-Signature (DocuSign)">
              {!docuSign || docuSign.status === null ? (
                /* No envelope yet */
                <div className="text-center py-2">
                  <p className="text-xs text-gray-400 mb-3">No signature request sent yet.</p>
                  <button
                    onClick={() => sendEnvelope.mutate()}
                    disabled={sendEnvelope.isPending}
                    className="w-full bg-[#105778] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#0b3f57] transition disabled:opacity-50"
                  >
                    {sendEnvelope.isPending ? 'Sending…' : 'Send for Signature'}
                  </button>
                </div>
              ) : docuSign.status === 'completed' ? (
                /* Signed */
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Signed
                    </span>
                  </div>
                  {docuSign.signed_at && (
                    <p className="text-xs text-gray-400">
                      Signed {fmtDateTime(docuSign.signed_at)}
                    </p>
                  )}
                </div>
              ) : docuSign.status === 'declined' || docuSign.status === 'voided' ? (
                /* Declined / voided — allow re-send */
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 capitalize">
                      {docuSign.status}
                    </span>
                  </div>
                  <button
                    onClick={() => sendEnvelope.mutate()}
                    disabled={sendEnvelope.isPending}
                    className="w-full border border-[#105778] text-[#105778] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#105778]/5 transition disabled:opacity-50"
                  >
                    {sendEnvelope.isPending ? 'Sending…' : 'Send New Envelope'}
                  </button>
                </div>
              ) : (
                /* Sent / delivered — pending signature */
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                      {docuSign.status === 'delivered' ? 'Viewed' : 'Awaiting Signature'}
                    </span>
                  </div>
                  {docuSign.sent_at && (
                    <p className="text-xs text-gray-400 mb-3">
                      Sent {fmtDateTime(docuSign.sent_at)}
                    </p>
                  )}
                  <button
                    onClick={() => sendEnvelope.mutate()}
                    disabled={sendEnvelope.isPending}
                    className="w-full text-sm text-[#1CA0DF] border border-[#1CA0DF] px-4 py-1.5 rounded-lg hover:bg-[#1CA0DF]/5 transition disabled:opacity-50"
                  >
                    {sendEnvelope.isPending ? 'Resending…' : 'Resend Reminder'}
                  </button>
                </div>
              )}
            </Section>

          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
