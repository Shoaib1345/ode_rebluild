import React, { useState, useRef, useMemo, Component } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class LeadErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <AdminLayout>
          <div className="max-w-5xl mx-auto rounded border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="font-semibold text-red-700 mb-2">Something went wrong rendering this lead.</p>
            <p className="text-xs text-red-500 font-mono mb-4">{this.state.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Reload page
            </button>
          </div>
        </AdminLayout>
      )
    }
    return this.props.children
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralUser { id: number; first_name: string; last_name: string; email: string }

interface Note {
  id: number; message: string; added_for: string | null; created_at: string
  author: { id: number; first_name: string; last_name: string } | null
}

interface LeadAction {
  id: number
  action_type: string | null
  message: string
  user_timezone: string | null
  created_at: string
  meta: Record<string, unknown> | null
  user: { id: number; first_name: string; last_name: string } | null
}

interface LeadInvoice {
  id: number; email: string | null; email_subject: string | null
  total_payable: number | null; encode_id: string | null
  invoice_status: number; created_at: string
}

interface FollowUp {
  id: number; follow_up_date: string; notes: string; status: number; created_at: string
  assigned_to: { id: number; first_name: string; last_name: string } | null
}

interface LeadDetail {
  id: number
  event_type_id: number | null
  first_name: string | null; last_name: string | null
  email: string | null; phone: string | null
  street: string | null; city: string | null; zip: string | null
  event_type_label: string | null; event_date: string | null
  event_state: string | null; event_name: string | null
  no_of_people: number | null; alcohol_served: string | null
  event_description: string | null
  special_activities: boolean; event_special_act_detail?: string | null
  bouncehouses: boolean; is_inflatables_coverage?: boolean
  vendor_activity: boolean; any_claims?: string | null
  carrier: string | null; coverage_limit: string | null
  submission_status: string; bound: boolean
  is_on_hold: boolean; is_priority_lead: boolean; is_email_blocked: boolean
  closing_reason: string | null; payment_id: string | null; payment_status: number
  lead_offered_plans: {
    rate_id?: number; carrier?: string
    premium?: number; broker_fee?: number; processing_fee?: number
    extra_charge?: number; total?: number
    min_limit?: number; max_limit?: number
  } | null
  ins_first_name: string | null; ins_last_name: string | null
  ins_street: string | null; ins_city: string | null; ins_state: string | null; ins_zip: string | null
  venue_name: string | null; venue_address: string | null
  venue_state: string | null; venue_zip: string | null
  contact_at_venue: string | null; venue_contact_email: string | null; venue_contact_number: string | null
  private_residence: boolean; waiver_sub_status: boolean
  hired_status: boolean; primary_basis: boolean
  additional_insured: string | null; user_timezone: string | null
  referred_by_affiliate_id: number | null; referred_by_planner_id: number | null; referred_by_customer_id: number | null
  referred_by_affiliate: ReferralUser | null; referred_by_planner: ReferralUser | null; referred_by_customer: ReferralUser | null
  affiliate_string: string | null; created_at: string
  notes: Note[]; actions: LeadAction[]; invoices: LeadInvoice[]; follow_ups?: FollowUp[]
  policy_pdf_path: string | null; receipt_pdf_path: string | null; coi_pdf_path: string | null
}

// ─── COI Wizard field bag ─────────────────────────────────────────────────────

interface CoiFields {
  // Step 1 – Producer
  application_date: string; agency_name: string; agency_address: string
  agency_city: string; agency_state: string; agency_zipcode: string
  contact_name: string; contact_phone: string; contact_fax: string; contact_email: string
  // Step 2 – Insurer
  insured_name: string; insured_address: string
  insured_city: string; insured_state: string; insured_zipcode: string
  insurance_a: string; naic_insurer_a: string
  insurance_b: string; naic_insurer_b: string
  insurance_c: string; naic_insurer_c: string
  insurance_d: string; naic_insurer_d: string
  insurance_e: string; naic_insurer_e: string
  insurance_f: string; naic_insurer_f: string
  // Step 3 – CGL
  certificate_number: string; revision_number: string
  commercial_general_liability: boolean; host_liqour: boolean; occur: boolean
  commercial_gl_policy_number: string
  commercial_gl_policy_eff: string; commercial_gl_policy_exp: string
  commercial_gl_each_occurrence: string; commercial_gl_general_aggregate: string
  commercial_gl_products_comp: string; commercial_gl_personal_adv_injury: string
  commercial_gl_med_exp: string; commercial_gl_rented_premises: string
  deductible: string; commercial_gl_addl_insd: boolean; commercial_gl_subr_wvd: boolean
  // Step 3 – CGL Gen'l Aggregate Limit Applies Per
  policy: boolean; pro_ject: boolean; loc: boolean; other: boolean
  // Step 3 – Automobile Liability
  auto_mobile_liability: string   // '' | 'ANY AUTO' | 'OWNED AUTOS ONLY' | 'SCHEDULED AUTOS' | 'HIRED AUTOS ONLY' | 'NON-OWNED AUTOS ONLY'
  auto_mobile_liability_addl_insd: boolean; auto_mobile_liability_subr_wvd: boolean
  auto_mobile_policy_number: string
  auto_mobile_policy_eff: string; auto_mobile_policy_exp: string
  combined_single_limit: string
  bodily_injury_per_person: string; bodily_injury_per_accident: string
  property_damage_per_accident: string
  // Step 3 – Umbrella / Excess Liability
  umbrella_liab: string   // '' | 'UMBRELLA LIAB' | 'OCCUR'
  excess_liab: string     // '' | 'EXCESS LIAB' | 'CLAIMS-MADE'
  umbrella_or_excess_addl_insd: boolean; excluded_subr_wvd: boolean
  ded_or_retention: string  // '' | 'DED' | 'RETENTION'
  retention_amount: string
  umbrella_or_excess_policy_number: string
  umbrella_or_excess_policy_eff: string; umbrella_or_excess_policy_exp: string
  umbrella_each_occurrence: string; umbrella_aggregate: string
  // Step 3 – Workers Compensation
  statute: string           // '' | 'PER STATUTE' | 'OTH-ER'
  workers_compensation: string  // '' | 'Y' | 'N'
  workers_compensation_policy_number: string
  workers_compensation_each_accident: string
  workers_compensation_disease_employee: string
  workers_compensation_disease_policy_limit: string
  // Step 4 – Finish
  description_of_operations: string
  certificate_holder_name: string; certificate_holder_address: string
  certificate_holder_city: string; certificate_holder_state: string; certificate_holder_zipcode: string
  coi_name: string; coi_category: string
}

// ─── Edit-lead field bag ──────────────────────────────────────────────────────

type EditFields = Partial<Pick<LeadDetail,
  'first_name'|'last_name'|'email'|'phone'|'street'|'city'|'zip'|
  'event_name'|'event_date'|'event_state'|'no_of_people'|'alcohol_served'|
  'event_description'|'special_activities'|'event_special_act_detail'|
  'bouncehouses'|'vendor_activity'|'private_residence'|'any_claims'|
  'ins_first_name'|'ins_last_name'|'ins_street'|'ins_city'|'ins_state'|'ins_zip'|
  'venue_name'|'venue_address'|'venue_state'|'venue_zip'|
  'contact_at_venue'|'venue_contact_email'|'venue_contact_number'|
  'carrier'|'coverage_limit'|'additional_insured'|
  'waiver_sub_status'|'hired_status'|'primary_basis'
>>

interface DocuSignStatus {
  envelope_id: string | null
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided' | null
  sent_at: string | null; signed_at: string | null
}

interface Assignee { id: number; first_name: string; last_name: string; email: string; role_name: string | null }
interface AssignableUser { id: number; first_name: string; last_name: string; email: string; role_name: string | null }

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

const STATUS_COLORS: Record<string, string> = {
  tried:                'bg-gray-100 text-gray-600',
  saved:                'bg-yellow-100 text-yellow-700',
  mq:                   'bg-orange-100 text-orange-700',
  plan_added_manually:  'bg-purple-100 text-purple-700',
  payment:              'bg-blue-100 text-blue-700',
  payment_received:     'bg-green-100 text-green-700',
  finished:             'bg-emerald-200 text-emerald-800',
}

const FILE_CATEGORIES = ['Quote','Policy','Certificate','Signed Acceptance','Questionnaire','Application','QR Form','LR Report','Other']

const COI_STEPS = ['Producer', 'Insurer', 'Coverages', 'Finish']

const CARRIER_INFO: Record<string, { a: string; naicA: string; b?: string; naicB?: string }> = {
  Thimble: { a: 'National Specialty Insurance Company', naicA: '22608' },
  FDean:   { a: 'United States Fire Insurance Company', naicA: '21113' },
  FDEAN:   { a: 'United States Fire Insurance Company', naicA: '21113' },
  HCC:     { a: 'New Hampshire Insurance Company', naicA: '23841', b: 'United States Fire Insurance Company', naicB: '21113' },
  ASI:     { a: 'Arch Insurance Company', naicA: '11150' },
  'K&K':   { a: 'Nationwide Mutual Insurance Company', naicA: '23787' },
  IH:      { a: 'Evanston Insurance Company', naicA: '35378' },
}

const FDEAN_EVENT_TYPES = [32, 10, 72] // Birthday, Wedding, Vendor at Event

function initCoiFields(lead: LeadDetail): CoiFields {
  const today    = new Date().toISOString().split('T')[0]
  const carrier  = lead.carrier ?? lead.lead_offered_plans?.carrier ?? ''
  const info     = CARRIER_INFO[carrier] ?? { a: '', naicA: '' }
  const plan     = lead.lead_offered_plans
  const minLimit = plan?.min_limit ?? 1
  const maxLimit = plan?.max_limit ?? 2

  // Effective / expiration dates (MM/DD/YYYY for PDF)
  // Strip any time component ("2026-05-24 00:00:00" or "2026-05-24T00:00:00Z")
  // before constructing the Date so we never get NaN.
  const rawEvtDate = lead.event_date
    ? lead.event_date.split('T')[0].split(' ')[0]
    : null
  const evtDate = rawEvtDate ? new Date(rawEvtDate + 'T00:00:00') : new Date()
  const expDate = new Date(evtDate); expDate.setDate(expDate.getDate() + 1)
  const toPdf   = (d: Date) =>
    `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`

  const isFdeanSpecial =
    ['FDean','FDEAN'].includes(carrier) &&
    FDEAN_EVENT_TYPES.includes(lead.event_type_id ?? 0)

  const hasAlcohol = ['hosted','sold','BYOB','Served'].includes(lead.alcohol_served ?? '')

  const insuredName = [lead.ins_first_name ?? lead.first_name, lead.ins_last_name ?? lead.last_name]
    .filter(Boolean).join(' ')
  const holderName  = [lead.first_name, lead.last_name].filter(Boolean).join(' ')

  const fmt = (n: number) => `$${(n * 1_000_000).toLocaleString()}`

  return {
    // Step 1
    application_date: today,
    agency_name: 'Jeewanjee Insurance Agency',
    agency_address: '1494 Hamilton Ave Suite 103',
    agency_city: 'San Jose', agency_state: 'CA', agency_zipcode: '95125',
    contact_name: 'Zain Jeewanjee', contact_phone: '408-217-6787',
    contact_fax: '408-997-7890', contact_email: 'support@onedayevent.com',
    // Step 2
    insured_name: insuredName,
    insured_address: lead.ins_street ?? lead.street ?? '',
    insured_city:    lead.ins_city  ?? lead.city   ?? '',
    insured_state:   lead.ins_state ?? lead.event_state ?? '',
    insured_zipcode: lead.ins_zip   ?? lead.zip    ?? '',
    insurance_a: info.a,    naic_insurer_a: info.naicA,
    insurance_b: info.b ?? '', naic_insurer_b: info.naicB ?? '',
    insurance_c: '', naic_insurer_c: '',
    insurance_d: '', naic_insurer_d: '',
    insurance_e: '', naic_insurer_e: '',
    insurance_f: '', naic_insurer_f: '',
    // Step 3
    certificate_number:       isFdeanSpecial ? 'USS474691' : '',
    revision_number:          '0',
    commercial_general_liability: true,
    host_liqour:              hasAlcohol,
    occur:                    true,
    commercial_gl_policy_number: isFdeanSpecial ? 'SRPGAPML-101-0722' : '',
    commercial_gl_policy_eff:    toPdf(evtDate),
    commercial_gl_policy_exp:    toPdf(expDate),
    commercial_gl_each_occurrence:     fmt(minLimit),
    commercial_gl_general_aggregate:   fmt(maxLimit),
    commercial_gl_products_comp:       fmt(maxLimit),
    commercial_gl_personal_adv_injury: fmt(minLimit),
    commercial_gl_med_exp:             '$5,000',
    commercial_gl_rented_premises:     '$100,000',
    deductible:               '',
    commercial_gl_addl_insd:  true,
    commercial_gl_subr_wvd:   lead.waiver_sub_status,
    // CGL Gen'l Aggregate Limit Applies Per
    policy: true, pro_ject: false, loc: false, other: false,
    // Automobile Liability (not applicable for event insurance — all blank)
    auto_mobile_liability: '', auto_mobile_liability_addl_insd: false, auto_mobile_liability_subr_wvd: false,
    auto_mobile_policy_number: '', auto_mobile_policy_eff: '', auto_mobile_policy_exp: '',
    combined_single_limit: '', bodily_injury_per_person: '', bodily_injury_per_accident: '',
    property_damage_per_accident: '',
    // Umbrella / Excess (not applicable for event insurance — all blank)
    umbrella_liab: '', excess_liab: '',
    umbrella_or_excess_addl_insd: false, excluded_subr_wvd: false,
    ded_or_retention: '', retention_amount: '',
    umbrella_or_excess_policy_number: '', umbrella_or_excess_policy_eff: '', umbrella_or_excess_policy_exp: '',
    umbrella_each_occurrence: '', umbrella_aggregate: '',
    // Workers Compensation (not applicable for event insurance — all blank)
    statute: '', workers_compensation: '',
    workers_compensation_policy_number: '', workers_compensation_each_accident: '',
    workers_compensation_disease_employee: '', workers_compensation_disease_policy_limit: '',
    // Step 4
    description_of_operations: lead.event_type_label
      ? `Event Type: ${lead.event_type_label}${lead.event_name ? ' | Event Name: ' + lead.event_name : ''}`
      : '',
    certificate_holder_name:    holderName,
    certificate_holder_address: lead.venue_address ?? lead.street ?? '',
    certificate_holder_city:    lead.city ?? '',
    certificate_holder_state:   lead.venue_state ?? lead.event_state ?? '',
    certificate_holder_zipcode: lead.venue_zip ?? lead.zip ?? '',
    coi_name:     `Certificate of Insurance - ODE00${lead.id}.pdf`,
    coi_category: 'Certificate',
  }
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
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

/**
 * Authenticated blob download — uses the axios instance (which carries the
 * Sanctum Bearer token) so the /api/files/* route isn't hit bare-browser.
 *
 * When the server returns an error (404 = not generated yet, 500 = storage
 * issue), Axios throws with responseType:'blob' — we read the JSON message
 * out of the blob and surface it as a toast.
 */
async function downloadFile(category: string, leadId: number, filename: string) {
  const { default: api } = await import('../../lib/axios')
  try {
    const resp = await api.get(`/files/${category}/${leadId}`, { responseType: 'blob' })
    const url  = URL.createObjectURL(resp.data)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err: unknown) {
    // Axios error with blob response — read JSON message from the blob
    const axiosErr = err as { response?: { data?: Blob } }
    const blob = axiosErr?.response?.data
    if (blob instanceof Blob) {
      try {
        const text = await blob.text()
        const json = JSON.parse(text)
        toast.error(json?.message ?? 'Download failed.')
        return
      } catch { /* fall through */ }
    }
    toast.error('Download failed. The file may not have been generated yet.')
  }
}

function v(val: string | number | boolean | null | undefined) {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  return String(val)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied!')).catch(() => {
    const el = document.createElement('input')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    toast.success('Copied!')
  })
}

// ─── UI Components ────────────────────────────────────────────────────────────

function Row4({ l1, v1, l2, v2 }: { l1: string; v1: ReactNode; l2?: string; v2?: ReactNode }) {
  return (
    <div className="grid grid-cols-4 py-1.5 border-b border-gray-100 last:border-0">
      <div className="text-sm font-semibold text-gray-700 pr-2">{l1}</div>
      <div className="text-sm text-gray-600 text-right pr-4">{v1 ?? '—'}</div>
      {l2 ? (
        <>
          <div className="text-sm font-semibold text-gray-700 pr-2">{l2}</div>
          <div className="text-sm text-gray-600 text-right">{v2 ?? '—'}</div>
        </>
      ) : <div className="col-span-2" />}
    </div>
  )
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-5 mb-2">
      <p className="text-2xl font-bold text-gray-900">{children}</p>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  )
}

function BadgeBtn({ onClick, children, variant = 'success' }: {
  onClick?: () => void; children: ReactNode; variant?: 'success' | 'primary' | 'danger'
}) {
  const colors = { success: 'bg-green-500 hover:bg-green-600 text-white', primary: 'bg-blue-500 hover:bg-blue-600 text-white', danger: 'bg-red-500 hover:bg-red-600 text-white' }
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold transition-colors ${colors[variant]}`}>
      {children}
    </button>
  )
}

function ActionBtn({ onClick, children, variant = 'default', disabled }: {
  onClick?: () => void; children: ReactNode
  variant?: 'default' | 'warning' | 'purple' | 'success' | 'danger' | 'primary'; disabled?: boolean
}) {
  const colors: Record<string, string> = {
    default: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
    warning: 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600',
    purple:  'bg-purple-600 border-purple-600 text-white hover:bg-purple-700',
    success: 'bg-green-500 border-green-500 text-white hover:bg-green-600',
    danger:  'bg-red-500 border-red-500 text-white hover:bg-red-600',
    primary: 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600',
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded transition-colors disabled:opacity-50 ${colors[variant]}`}>
      {children}
    </button>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`bg-white rounded-lg shadow-xl w-full ${width} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"

// ─── Activity Timeline ────────────────────────────────────────────────────────

type ActionTypeDef = {
  label: string
  icon: React.ReactNode
  dot: string      // tailwind bg-* for the dot
  ring: string     // tailwind ring-* for dot ring
  text: string     // tailwind text-* for label
  bg:   string     // tailwind bg-* for card
}

const ACTION_DEFS: Record<string, ActionTypeDef> = {
  lead_created:      { label: 'Lead Created',         dot: 'bg-green-500',  ring: 'ring-green-200',  text: 'text-green-700',  bg: 'bg-green-50',  icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg> },
  email_sent:        { label: 'Email Sent',            dot: 'bg-blue-500',   ring: 'ring-blue-200',   text: 'text-blue-700',   bg: 'bg-blue-50',   icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg> },
  invoice_created:   { label: 'Invoice Created',       dot: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700', bg: 'bg-purple-50', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg> },
  invoice_viewed:    { label: 'Invoice Viewed',        dot: 'bg-amber-500',  ring: 'ring-amber-200',  text: 'text-amber-700',  bg: 'bg-amber-50',  icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd"/></svg> },
  invoice_paid:      { label: 'Payment Received',      dot: 'bg-green-600',  ring: 'ring-green-200',  text: 'text-green-800',  bg: 'bg-green-50',  icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> },
  pdf_generated:     { label: 'Policy PDF Generated',  dot: 'bg-rose-500',   ring: 'ring-rose-200',   text: 'text-rose-700',   bg: 'bg-rose-50',   icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg> },
  coi_generated:     { label: 'COI Generated',         dot: 'bg-teal-500',   ring: 'ring-teal-200',   text: 'text-teal-700',   bg: 'bg-teal-50',   icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"/></svg> },
  agent_assigned:    { label: 'Agent Assigned',        dot: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-700', bg: 'bg-indigo-50', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zm8-2a2 2 0 11-4 0 2 2 0 014 0zm-4 7a4 4 0 00-8 0v1h8v-1z"/><path d="M16 11a1 1 0 10-2 0v1h-1a1 1 0 000 2h1v1a1 1 0 102 0v-1h1a1 1 0 000-2h-1v-1z"/></svg> },
  agent_unassigned:  { label: 'Agent Removed',         dot: 'bg-orange-500', ring: 'ring-orange-200', text: 'text-orange-700', bg: 'bg-orange-50', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12z"/><path d="M13 8a1 1 0 011 1v3h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1V9a1 1 0 011-1z"/></svg> },
  note_added:        { label: 'Note Added',            dot: 'bg-gray-400',   ring: 'ring-gray-200',   text: 'text-gray-600',   bg: 'bg-gray-50',   icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"/></svg> },
  follow_up_added:   { label: 'Follow-up Scheduled',  dot: 'bg-yellow-500', ring: 'ring-yellow-200', text: 'text-yellow-800', bg: 'bg-yellow-50', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg> },
  status_changed:    { label: 'Status Changed',        dot: 'bg-orange-400', ring: 'ring-orange-200', text: 'text-orange-700', bg: 'bg-orange-50', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg> },
  docusign_sent:     { label: 'DocuSign Sent',         dot: 'bg-blue-400',   ring: 'ring-blue-200',   text: 'text-blue-700',   bg: 'bg-blue-50',   icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-2.207 2.207L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg> },
  docusign_completed:{ label: 'DocuSign Completed',    dot: 'bg-green-500',  ring: 'ring-green-200',  text: 'text-green-700',  bg: 'bg-green-50',  icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> },
  lead_viewed_agent: { label: 'Opened by Agent',       dot: 'bg-sky-500',    ring: 'ring-sky-200',    text: 'text-sky-700',    bg: 'bg-sky-50',    icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clipRule="evenodd"/></svg> },
}

const DEFAULT_DEF: ActionTypeDef = {
  label: 'Activity', dot: 'bg-gray-300', ring: 'ring-gray-100', text: 'text-gray-500', bg: 'bg-gray-50',
  icon: <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="10" r="4"/></svg>,
}

function ActionMetaDetail({ action }: { action: LeadAction }) {
  const m = action.meta
  if (!m) return null

  const chips: { label: string; value: string }[] = []
  if (typeof m.to === 'string')             chips.push({ label: 'To',      value: m.to })
  if (typeof m.subject === 'string')        chips.push({ label: 'Subject', value: m.subject })
  if (typeof m.amount === 'number')         chips.push({ label: 'Amount',  value: `$${Number(m.amount).toFixed(2)}` })
  if (typeof m.assignee_name === 'string')  chips.push({ label: 'Assignee', value: m.assignee_name })
  if (typeof m.role === 'string')           chips.push({ label: 'Role',    value: m.role })
  if (typeof m.follow_up_date === 'string') chips.push({ label: 'Date',    value: m.follow_up_date })
  if (typeof m.note_preview === 'string')   chips.push({ label: 'Note',    value: m.note_preview })
  if (typeof m.notes_preview === 'string')  chips.push({ label: 'Notes',   value: m.notes_preview })
  if (typeof m.filename === 'string')       chips.push({ label: 'File',    value: m.filename })
  if (typeof m.invoice_id === 'number')     chips.push({ label: 'Invoice', value: `#${m.invoice_id}` })
  if (typeof m.status === 'string')         chips.push({ label: 'Status',  value: m.status })
  if (typeof m.ip === 'string')             chips.push({ label: 'IP',      value: m.ip })
  if (typeof m.customer_email === 'string') chips.push({ label: 'Customer', value: m.customer_email })

  if (chips.length === 0) return null

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {chips.map(({ label, value }) => (
        <span key={label} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">
          <span className="font-semibold text-gray-400">{label}:</span>
          <span className="truncate max-w-[200px]">{value}</span>
        </span>
      ))}
    </div>
  )
}

function ActivityTimeline({ actions }: { actions: LeadAction[] }) {
  const [showAll, setShowAll] = React.useState(false)
  const sorted = [...actions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const visible = showAll ? sorted : sorted.slice(0, 12)

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">Activity Timeline</h3>
        <span className="text-xs text-gray-400">{sorted.length} event{sorted.length !== 1 ? 's' : ''}</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 px-5 py-6 text-center">No activity recorded yet.</p>
      ) : (
        <div className="px-5 py-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-4">
              {visible.map(action => {
                const def = ACTION_DEFS[action.action_type ?? ''] ?? DEFAULT_DEF
                const actor = action.user
                  ? `${action.user.first_name} ${action.user.last_name}`
                  : 'System'
                const isCustomer = !action.user && (
                  action.action_type === 'invoice_viewed' ||
                  action.action_type === 'invoice_paid'
                )

                return (
                  <div key={action.id} className="relative pl-9 group">
                    {/* Dot */}
                    <div className={`absolute left-0 top-1 h-[30px] w-[30px] rounded-full ${def.dot} ring-4 ${def.ring} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                      {def.icon}
                    </div>

                    {/* Card */}
                    <div className={`rounded-lg border border-gray-100 ${def.bg} px-4 py-2.5`}>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${def.text}`}>
                            {def.label}
                          </span>
                          <span className="text-xs font-medium text-gray-700">
                            {action.message}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                          {fmtDateTime(action.created_at)}
                        </span>
                      </div>

                      <ActionMetaDetail action={action} />

                      <div className="mt-1 text-[10px] text-gray-400">
                        {isCustomer ? '👤 Customer' : `🔒 ${actor}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {sorted.length > 12 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-4 w-full text-xs text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 rounded py-2 transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${sorted.length} events`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  return (
    <LeadErrorBoundary>
      <LeadDetailInner />
    </LeadErrorBoundary>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function LeadDetailInner() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  // ── Modal state ───────────────────────────────────────────────────────────
  const [moreActionsOpen,  setMoreActionsOpen]  = useState(false)
  const [assignModalOpen,  setAssignModalOpen]  = useState(false)
  const [uploadModalOpen,  setUploadModalOpen]  = useState(false)
  const [followUpOpen,     setFollowUpOpen]     = useState(false)
  const [sendEmailOpen,    setSendEmailOpen]     = useState(false)
  const [callDispOpen,     setCallDispOpen]      = useState(false)
  const [selectedUserId,   setSelectedUserId]   = useState<number | ''>('')

  // ── COI Wizard state ──────────────────────────────────────────────────────
  const [coiWizardOpen, setCoiWizardOpen] = useState(false)
  const [coiStep,       setCoiStep]       = useState(0)
  const [coiFields,     setCoiFields]     = useState<CoiFields | null>(null)

  const setCoiField = <K extends keyof CoiFields>(key: K, val: CoiFields[K]) =>
    setCoiFields(prev => prev ? { ...prev, [key]: val } : prev)

  const openCoiWizard = () => {
    if (!lead) return
    setCoiFields(initCoiFields(lead))
    setCoiStep(0)
    setCoiWizardOpen(true)
  }

  // ── Edit Lead state ───────────────────────────────────────────────────────
  const [editOpen,   setEditOpen]   = useState(false)
  const [editFields, setEditFields] = useState<EditFields>({})

  const setEditField = <K extends keyof EditFields>(key: K, val: EditFields[K]) =>
    setEditFields(prev => ({ ...prev, [key]: val }))

  const openEdit = () => {
    if (!lead) return
    setEditFields({
      first_name: lead.first_name, last_name: lead.last_name,
      email: lead.email, phone: lead.phone,
      street: lead.street, city: lead.city, zip: lead.zip,
      event_name: lead.event_name, event_date: lead.event_date,
      event_state: lead.event_state, no_of_people: lead.no_of_people,
      alcohol_served: lead.alcohol_served, event_description: lead.event_description,
      special_activities: lead.special_activities,
      event_special_act_detail: lead.event_special_act_detail,
      bouncehouses: lead.bouncehouses, vendor_activity: lead.vendor_activity,
      private_residence: lead.private_residence, any_claims: lead.any_claims,
      ins_first_name: lead.ins_first_name, ins_last_name: lead.ins_last_name,
      ins_street: lead.ins_street, ins_city: lead.ins_city,
      ins_state: lead.ins_state, ins_zip: lead.ins_zip,
      venue_name: lead.venue_name, venue_address: lead.venue_address,
      venue_state: lead.venue_state, venue_zip: lead.venue_zip,
      contact_at_venue: lead.contact_at_venue,
      venue_contact_email: lead.venue_contact_email,
      venue_contact_number: lead.venue_contact_number,
      carrier: lead.carrier, coverage_limit: lead.coverage_limit,
      additional_insured: lead.additional_insured,
      waiver_sub_status: lead.waiver_sub_status,
      hired_status: lead.hired_status, primary_basis: lead.primary_basis,
    })
    setEditOpen(true)
  }

  // ── Delete confirm state ──────────────────────────────────────────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // ── Upload file state ─────────────────────────────────────────────────────
  const [uploadName,       setUploadName]       = useState('')
  const [uploadCategory,   setUploadCategory]   = useState('Other')
  const [uploadComments,   setUploadComments]   = useState('')
  const [uploadToCustomer, setUploadToCustomer] = useState(false)
  const [uploadFile,       setUploadFile]       = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Follow-up state ───────────────────────────────────────────────────────
  const [fuDate,   setFuDate]   = useState('')
  const [fuNote,   setFuNote]   = useState('')
  const [fuUserId, setFuUserId] = useState<number | ''>('')

  // ── Send email state ──────────────────────────────────────────────────────
  const [emailTo,      setEmailTo]      = useState('')
  const [emailCc,      setEmailCc]      = useState('')
  const [emailBcc,     setEmailBcc]     = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody,    setEmailBody]    = useState('')

  // ── Call disposition state ────────────────────────────────────────────────
  const [callNotes, setCallNotes] = useState('')

  // ── Note state ────────────────────────────────────────────────────────────
  const [noteText, setNoteText] = useState('')
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // ── Referrer + Plan modal state ───────────────────────────────────────────
  const [referrerOpen,   setReferrerOpen]   = useState(false)
  const [referrerRole,   setReferrerRole]   = useState<'affiliate' | 'planner' | 'customer'>('affiliate')
  const [referrerSearch, setReferrerSearch] = useState('')
  const [planOpen, setPlanOpen] = useState(false)
  const [planForm, setPlanForm] = useState({
    carrier: '', min_limit: '', max_limit: '', premium: '', broker_fee: '', processing_fee: '', total: '',
  })

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['admin-lead', id],
    queryFn:  () => api.get<LeadDetail>(`/admin/leads/${id}`).then(r => r.data),
    enabled:  !!id,
  })

  const { data: docuSign, refetch: refetchDocuSign } = useQuery<DocuSignStatus>({
    queryKey: ['admin-lead-docusign', id],
    queryFn:  () => api.get(`/admin/leads/${id}/docusign/status`).then(r => r.data),
    enabled:  !!id,
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return (s === 'sent' || s === 'delivered') ? 30_000 : false
    },
  })

  interface PdfStatus { policy_pdf_path: string | null; receipt_pdf_path: string | null; coi_pdf_path: string | null }
  const { data: pdfStatus, refetch: refetchPdf } = useQuery<PdfStatus>({
    queryKey: ['admin-lead-pdfs', id],
    queryFn:  () => api.get(`/admin/leads/${id}/pdf-status`).then(r => r.data),
    enabled:  !!id,
  })

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

  // Referrer candidates — searched by role + name/email when the modal is open.
  const { data: referrerCandidates = [] } = useQuery<{ id: number; first_name: string; last_name: string; email: string }[]>({
    queryKey: ['referrer-candidates', referrerRole, referrerSearch],
    queryFn:  () => api.get('/admin/users', { params: { role: referrerRole, search: referrerSearch, per_page: 8 } })
                       .then(r => r.data.data ?? r.data),
    enabled:  referrerOpen && referrerSearch.trim().length >= 2,
  })

  const assignedIds     = useMemo(() => new Set((assignments?.assignees ?? []).map(a => a.id)), [assignments])
  const unassignedUsers = useMemo(() => assignableUsers.filter(u => !assignedIds.has(u.id)), [assignableUsers, assignedIds])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const patch = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/leads/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-lead', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      toast.success('Lead updated.')
    },
    onError: () => toast.error('Update failed.'),
  })

  // ── Referrer handlers ─────────────────────────────────────────────────────
  const setReferrer = (userId: number) => {
    const key = referrerRole === 'affiliate' ? 'referred_by_affiliate_id'
      : referrerRole === 'planner' ? 'referred_by_planner_id' : 'referred_by_customer_id'
    patch.mutate(
      { referred_by_affiliate_id: null, referred_by_planner_id: null, referred_by_customer_id: null, [key]: userId },
      { onSuccess: () => setReferrerOpen(false) },
    )
  }
  const removeReferrer = () =>
    patch.mutate(
      { referred_by_affiliate_id: null, referred_by_planner_id: null, referred_by_customer_id: null },
      { onSuccess: () => setReferrerOpen(false) },
    )

  // ── Plan handlers ─────────────────────────────────────────────────────────
  const openPlan = () => {
    const p = (lead?.lead_offered_plans ?? {}) as Record<string, unknown>
    const s = (v: unknown) => (v != null ? String(v) : '')
    setPlanForm({
      carrier:        lead?.carrier ?? s(p.carrier),
      min_limit:      s(p.min_limit),
      max_limit:      s(p.max_limit),
      premium:        s(p.premium),
      broker_fee:     s(p.broker_fee),
      processing_fee: s(p.processing_fee),
      total:          s(p.total),
    })
    setPlanOpen(true)
  }
  const savePlan = () => {
    const num = (v: string) => (v.trim() === '' ? null : Number(v))
    patch.mutate(
      {
        carrier: planForm.carrier || null,
        coverage_limit: planForm.min_limit && planForm.max_limit ? `${planForm.min_limit}/${planForm.max_limit}` : null,
        lead_offered_plans: {
          carrier:        planForm.carrier || null,
          min_limit:      num(planForm.min_limit),
          max_limit:      num(planForm.max_limit),
          premium:        num(planForm.premium),
          broker_fee:     num(planForm.broker_fee),
          processing_fee: num(planForm.processing_fee),
          total:          num(planForm.total),
        },
      },
      { onSuccess: () => setPlanOpen(false) },
    )
  }

  const copyBilling = () => {
    if (!lead) return
    copyToClipboard([
      `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim(),
      lead.street, [lead.city, lead.event_state, lead.zip].filter(Boolean).join(', '),
      lead.email, lead.phone,
    ].filter(Boolean).join('\n'))
  }

  const addNote = useMutation({
    mutationFn: (message: string) => api.post<Note>(`/admin/leads/${id}/notes`, { message }).then(r => r.data),
    onSuccess: (note) => {
      queryClient.setQueryData<LeadDetail>(['admin-lead', id], (old) => {
        if (!old) return old
        return { ...old, notes: [note, ...(old.notes ?? [])] }
      })
      setNoteText('')
      toast.success('Note added.')
    },
    onError: () => toast.error('Failed to add note.'),
  })

  const generatePdf = useMutation({
    mutationFn: (type: 'policy' | 'coi') =>
      api.post(`/admin/leads/${id}/generate-pdf${type === 'coi' ? '/coi' : ''}`),
    onSuccess: (_d, type) => {
      toast.success(type === 'coi' ? 'COI queued.' : 'Policy & receipt queued.')
      setTimeout(() => void refetchPdf(), 500)
    },
    onError: () => toast.error('PDF generation failed.'),
  })

  const assignUser = useMutation({
    mutationFn: (userId: number) => api.post(`/admin/leads/${id}/assignments`, { user_id: userId }),
    onSuccess: () => { toast.success('User assigned.'); setSelectedUserId(''); setAssignModalOpen(false); void refetchAssignments() },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message ?? 'Failed to assign.'),
  })

  const unassignUser = useMutation({
    mutationFn: (userId: number) => api.delete(`/admin/leads/${id}/assignments/${userId}`),
    onSuccess: () => { toast.success('Assignment removed.'); void refetchAssignments() },
    onError: () => toast.error('Failed to remove.'),
  })

  const sendEnvelope = useMutation({
    mutationFn: () => api.post(`/admin/leads/${id}/docusign/send`),
    onSuccess: () => { toast.success('Envelope sent.'); void refetchDocuSign() },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message ?? 'Failed to send.'),
  })

  const uploadFileMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error('No file selected')
      const fd = new FormData()
      fd.append('name',             uploadName)
      fd.append('category',         uploadCategory)
      fd.append('file',             uploadFile)
      fd.append('comments',         uploadComments)
      fd.append('send_to_customer', uploadToCustomer ? '1' : '0')
      return api.post(`/admin/leads/${id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      toast.success('File uploaded.')
      setUploadModalOpen(false)
      setUploadName(''); setUploadCategory('Other'); setUploadComments('')
      setUploadToCustomer(false); setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: () => toast.error('Upload failed.'),
  })

  const createFollowUp = useMutation({
    mutationFn: () => api.post(`/admin/leads/${id}/follow-ups`, { follow_up_date: fuDate, notes: fuNote, user_id: fuUserId }),
    onSuccess: () => {
      toast.success('Follow-up created.')
      setFollowUpOpen(false); setFuDate(''); setFuNote(''); setFuUserId('')
      void queryClient.invalidateQueries({ queryKey: ['admin-lead', id] })
    },
    onError: () => toast.error('Failed to create follow-up.'),
  })

  const sendEmailMutation = useMutation({
    mutationFn: () => api.post(`/admin/leads/${id}/email`, {
      to: emailTo, cc: emailCc, bcc: emailBcc, subject: emailSubject, message: emailBody,
    }),
    onSuccess: () => {
      toast.success('Email sent.')
      setSendEmailOpen(false); setEmailTo(''); setEmailCc(''); setEmailBcc(''); setEmailSubject(''); setEmailBody('')
      void queryClient.invalidateQueries({ queryKey: ['admin-lead', id] })
    },
    onError: () => toast.error('Failed to send email.'),
  })

  const addCallNote = useMutation({
    mutationFn: () => api.post<Note>(`/admin/leads/${id}/notes`, { message: `Call Disposition: ${callNotes}` }).then(r => r.data),
    onSuccess: (note) => {
      queryClient.setQueryData<LeadDetail>(['admin-lead', id], (old) => {
        if (!old) return old
        return { ...old, notes: [note, ...(old.notes ?? [])] }
      })
      toast.success('Call note added.')
      setCallDispOpen(false); setCallNotes('')
    },
    onError: () => toast.error('Failed to add call note.'),
  })

  const generateCoiWizard = useMutation({
    mutationFn: (fields: CoiFields) =>
      api.post(`/admin/leads/${id}/generate-pdf/coi`, { fields }),
    onSuccess: () => {
      toast.success('COI generated successfully!')
      setCoiWizardOpen(false)
      void refetchPdf()
      void queryClient.invalidateQueries({ queryKey: ['admin-lead', id] })
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'COI generation failed. Ensure PDFtk is installed.'),
  })

  const editLeadMutation = useMutation({
    mutationFn: (data: EditFields) => api.patch(`/admin/leads/${id}`, data),
    onSuccess: () => {
      toast.success('Lead updated.')
      setEditOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin-lead', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
    },
    onError: () => toast.error('Failed to update lead.'),
  })

  const deleteLead = useMutation({
    mutationFn: () => api.delete(`/admin/leads/${id}`),
    onSuccess: () => {
      toast.success('Lead deleted.')
      navigate('/admin/leads')
    },
    onError: () => toast.error('Failed to delete lead.'),
  })

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-100 rounded" />
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </AdminLayout>
    )
  }

  if (isError || !lead) {
    return (
      <AdminLayout>
        <div className="rounded border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">
          Lead not found.{' '}
          <button onClick={() => navigate('/admin/leads')} className="underline">Back to leads</button>
        </div>
      </AdminLayout>
    )
  }

  const plan        = lead.lead_offered_plans
  const statusLabel = STATUSES.find(s => s.value === lead.submission_status)?.label ?? lead.submission_status
  const referralUser = lead.referred_by_affiliate ?? lead.referred_by_planner ?? lead.referred_by_customer

  // Helper for dollar values from plan (handles undefined gracefully)
  const planVal = (n: number | undefined) => n != null ? `$${Number(n).toFixed(2)}` : '—'
  const planMillion = (n: number | undefined) => n != null ? `${n} Million` : '—'

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* ══ PAGE TITLE ══════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Lead Details (ODE00{lead.id})</h4>
            {referralUser && (
              <p className="text-sm text-gray-600 mt-0.5">
                Referred By: <strong>{referralUser.first_name} {referralUser.last_name}</strong>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.submission_status] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusLabel}
            </span>
            {lead.bound          && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Bound</span>}
            {lead.is_on_hold     && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">On Hold</span>}
            {lead.is_priority_lead && <span className="text-amber-500 text-lg" title="Priority lead">★</span>}
            {lead.is_email_blocked && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Email Blocked</span>}
          </div>
        </div>

        {/* ══ ACTION BAR ══════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-2">
          <ActionBtn variant="warning" onClick={() => navigate('/admin/leads')}>Back</ActionBtn>

          <ActionBtn variant="warning" onClick={openCoiWizard}>
            Create COI
          </ActionBtn>

          <ActionBtn onClick={() => setAssignModalOpen(true)}>Assign Lead</ActionBtn>

          <ActionBtn variant="purple" onClick={() => setUploadModalOpen(true)}>Upload File</ActionBtn>

          <ActionBtn variant="warning" onClick={() => navigate(`/admin/invoices/new?lead_id=${lead.id}`)}>
            Send Invoice
          </ActionBtn>

          <ActionBtn variant="success" onClick={() => toast('Coming soon — Add New Quote')}>
            Add New Quote
          </ActionBtn>

          {/* More Actions dropdown */}
          <div className="relative">
            <ActionBtn onClick={() => setMoreActionsOpen(o => !o)}>
              More Actions ▾
            </ActionBtn>
            {moreActionsOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded shadow-lg z-50 py-1">
                {[
                  { label: 'Call Disposition',       fn: () => { setCallDispOpen(true) } },
                  { label: 'Send Quote Request',     fn: () => toast('Coming soon') },
                  { label: 'Email Questionnaire',    fn: () => toast('Coming soon') },
                  { label: 'Download Questionnaire', fn: () => toast('Coming soon') },
                  { label: 'Email Carrier',          fn: () => toast('Coming soon') },
                  null,
                  { label: 'Cancel Lead',            fn: () => patch.mutate({ closing_reason: 'Cancelled' }) },
                  { label: 'Payment Received',       fn: () => patch.mutate({ submission_status: 'payment_received' }) },
                  { label: 'Follow Up Lead',         fn: () => { setFuUserId(''); setFollowUpOpen(true) } },
                  { label: 'Process Payments',       fn: () => toast('Coming soon') },
                  null,
                  { label: lead.is_email_blocked ? 'Unblock Email' : 'Block Email',
                    fn: () => patch.mutate({ is_email_blocked: !lead.is_email_blocked }) },
                  { label: lead.is_priority_lead ? 'Not a Priority' : 'Priority Lead',
                    fn: () => patch.mutate({ is_priority_lead: !lead.is_priority_lead }) },
                  { label: lead.is_on_hold ? 'Remove Hold' : 'Put On Hold',
                    fn: () => patch.mutate({ is_on_hold: !lead.is_on_hold }) },
                ].map((item, idx) =>
                  item === null ? (
                    <hr key={idx} className="my-1 border-gray-100" />
                  ) : (
                    <button key={item.label} type="button"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => { item.fn(); setMoreActionsOpen(false) }}>
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Bound toggle */}
          {(lead.submission_status === 'payment' || lead.submission_status === 'payment_received') && (
            <ActionBtn variant={lead.bound ? 'danger' : 'default'}
              onClick={() => patch.mutate({ bound: !lead.bound })} disabled={patch.isPending}>
              {lead.bound ? '🔒 Unbound' : '🔓 Bound'}
            </ActionBtn>
          )}

          <ActionBtn variant="primary" onClick={openEdit}>✏ Edit</ActionBtn>
          <ActionBtn variant="danger"  onClick={() => setDeleteConfirmOpen(true)} disabled={deleteLead.isPending}>✕ Delete</ActionBtn>

          <div className="flex-1" />

          <select value={lead.submission_status} disabled={patch.isPending}
            onChange={e => patch.mutate({ submission_status: e.target.value })}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* ══ MAIN PANEL ══════════════════════════════════════════════════ */}
        <div className="rounded border border-gray-200 overflow-hidden">

          <div className="bg-[#3CB371] px-4 py-3">
            <h3 className="text-white font-semibold text-base">Lead Info</h3>
          </div>

          <div className="bg-white px-6 py-4">

            {/* ── Event Details ─────────────────────────────────────────── */}
            <SectionTitle>Event Details</SectionTitle>
            <Row4 l1="Event Name"  v1={v(lead.event_name)}    l2="Event Type"          v2={v(lead.event_type_label)} />
            <Row4 l1="Event State" v1={v(lead.event_state)}   l2="Event Date"          v2={fmtDate(lead.event_date)} />
            <Row4 l1="Alcohol Will Be" v1={v(lead.alcohol_served)} l2="Any Special Activity" v2={v(lead.special_activities)} />
            {lead.special_activities && (
              <Row4 l1="Special Activity Detail" v1={v(lead.event_special_act_detail)} l2="Vendor Activity" v2={v(lead.vendor_activity)} />
            )}
            <Row4 l1="No. Of Guests" v1={v(lead.no_of_people)} l2="Bouncehouses or Inflatables" v2={v(lead.bouncehouses)} />
            {lead.bouncehouses && <Row4 l1="Have Own Coverage?" v1={v(lead.is_inflatables_coverage)} />}
            <Row4 l1="Private Residence" v1={v(lead.private_residence)} l2="Any Claims" v2={v(lead.any_claims)} />

            {/* ── Venue Details ─────────────────────────────────────────── */}
            <SectionTitle>Venue Details</SectionTitle>
            <Row4 l1="Venue Name"            v1={v(lead.venue_name)}           l2="Contact at Venue"     v2={v(lead.contact_at_venue)} />
            <Row4 l1="Venue Contact Email"   v1={v(lead.venue_contact_email)}  l2="Venue Contact Number" v2={v(lead.venue_contact_number)} />
            <Row4 l1="Street Address"        v1={v(lead.venue_address)}        l2="State"                v2={v(lead.venue_state)} />
            <Row4 l1="Zipcode"               v1={v(lead.venue_zip)} />

            {/* ── Insured Details ───────────────────────────────────────── */}
            <SectionTitle action={<BadgeBtn onClick={copyBilling}>Copy Billing Details</BadgeBtn>}>Insured Details</SectionTitle>
            <Row4 l1="First Name" v1={v(lead.ins_first_name)} l2="Last Name" v2={v(lead.ins_last_name)} />
            <Row4 l1="Street"     v1={v(lead.ins_street)}     l2="City"      v2={v(lead.ins_city)} />
            <Row4 l1="State"      v1={v(lead.ins_state)}      l2="Zipcode"   v2={v(lead.ins_zip)} />

            {/* ── Referrer Details ──────────────────────────────────────── */}
            <SectionTitle action={<BadgeBtn onClick={() => { setReferrerSearch(''); setReferrerOpen(true) }}>{referralUser ? 'Edit Referrer' : 'Add Referrer'}</BadgeBtn>}>
              Referrer Details
            </SectionTitle>
            {lead.referred_by_affiliate ? (
              <>
                <Row4 l1="First Name" v1={lead.referred_by_affiliate.first_name} l2="Last Name" v2={lead.referred_by_affiliate.last_name} />
                <Row4 l1="Referrer's Email" v1={lead.referred_by_affiliate.email} />
              </>
            ) : lead.referred_by_planner ? (
              <>
                <Row4 l1="First Name" v1={lead.referred_by_planner.first_name} l2="Last Name" v2={lead.referred_by_planner.last_name} />
                <Row4 l1="Referrer's Email" v1={lead.referred_by_planner.email} />
              </>
            ) : lead.referred_by_customer ? (
              <>
                <Row4 l1="First Name" v1={lead.referred_by_customer.first_name} l2="Last Name" v2={lead.referred_by_customer.last_name} />
                <Row4 l1="Referrer's Email" v1={lead.referred_by_customer.email} />
              </>
            ) : lead.affiliate_string ? (
              <Row4 l1="Affiliate String" v1={lead.affiliate_string} />
            ) : (
              <p className="text-sm text-gray-500 py-2">No Referral</p>
            )}

            {/* ── Billing Details ───────────────────────────────────────── */}
            <SectionTitle>Billing Details</SectionTitle>
            <Row4 l1="First Name" v1={v(lead.first_name)} l2="Last Name" v2={v(lead.last_name)} />
            <Row4 l1="Street"     v1={v(lead.street)}     l2="City"      v2={v(lead.city)} />
            <Row4 l1="State"      v1={v(lead.event_state)} l2="Zipcode"  v2={v(lead.zip)} />
            {/* Email row — with green badge like production */}
            <div className="grid grid-cols-4 py-1.5 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-700">Email</div>
              <div className="text-sm text-right pr-4">
                {lead.email
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">{lead.email}</span>
                  : '—'}
              </div>
              <div className="text-sm font-semibold text-gray-700">Phone</div>
              <div className="text-sm text-gray-600 text-right">{v(lead.phone)}</div>
            </div>

            {/* ── Email Details ─────────────────────────────────────────── */}
            <SectionTitle
              action={
                <>
                  <BadgeBtn onClick={() => { setEmailTo(lead.email ?? ''); setSendEmailOpen(true) }}>Send Email</BadgeBtn>
                  <BadgeBtn variant="primary" onClick={() => lead.email && copyToClipboard(lead.email)}>Copy Email</BadgeBtn>
                </>
              }
            >
              Email Details
            </SectionTitle>
            <p className="text-sm text-gray-600 py-1">
              {lead.email
                ? <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                : 'No email on record.'}
            </p>

            {/* ── Event Descriptions ────────────────────────────────────── */}
            {lead.event_description && (
              <>
                <SectionTitle action={<BadgeBtn onClick={openEdit}>Add Event Description</BadgeBtn>}>Event Descriptions</SectionTitle>
                <p className="text-sm text-gray-700 whitespace-pre-wrap py-2">{lead.event_description}</p>
              </>
            )}

            {/* ── Additional Coverage ───────────────────────────────────── */}
            <SectionTitle>Additional Coverage</SectionTitle>
            <Row4
              l1="Waiver of Subrogation"
              v1={<span className={lead.waiver_sub_status ? 'text-red-600 font-semibold' : ''}>{v(lead.waiver_sub_status)}</span>}
              l2="Non Owned / Hired Auto Liability"
              v2={<span className={lead.hired_status ? 'text-red-600 font-semibold' : ''}>{v(lead.hired_status)}</span>}
            />
            <Row4
              l1="Primary / Non-contributory Basis"
              v1={<span className={lead.primary_basis ? 'text-red-600 font-semibold' : ''}>{v(lead.primary_basis)}</span>}
            />

            {/* ── Plan Selected Details ─────────────────────────────────── */}
            {plan ? (
              <>
                <SectionTitle action={<BadgeBtn onClick={openPlan}>Update Plan</BadgeBtn>}>Plan Selected Details</SectionTitle>

                {/* Row 1: Carrier | Min Limit | Max Limit | Total Payment */}
                <Row4
                  l1="Carrier"       v1={v(plan.carrier)}
                  l2="Min Limit"     v2={planMillion(plan.min_limit)}
                />
                <Row4
                  l1="Max Limit"     v1={planMillion(plan.max_limit)}
                  l2="Total Payment" v2={planVal(plan.total)}
                />

                {/* Row 2: Premium | N.O.H.A | P.A.N.C.B | W.O.S */}
                <Row4
                  l1="Premium"   v1={planVal(plan.premium)}
                  l2="N.O.H.A"   v2={v(lead.hired_status)}
                />
                <Row4
                  l1="P.A.N.C.B" v1={v(lead.primary_basis)}
                  l2="W.O.S"     v2={v(lead.waiver_sub_status)}
                />

                {/* Row 3: Additional Insured | Broker Fee | Processing Fee | Extra Charge */}
                <Row4
                  l1="Additional Insured" v1={v(lead.additional_insured)}
                  l2="Broker Fee"         v2={planVal(plan.broker_fee)}
                />
                <Row4
                  l1="Processing Fee" v1={planVal(plan.processing_fee)}
                  l2="Extra Charge"   v2={plan.extra_charge && plan.extra_charge > 0 ? planVal(plan.extra_charge) : '0'}
                />

                <Row4
                  l1="Stripe Payment ID"
                  v1={<span className="font-mono text-xs break-all">{v(lead.payment_id)}</span>}
                />
              </>
            ) : (
              <>
                <SectionTitle action={<BadgeBtn onClick={openPlan}>Add Plan</BadgeBtn>}>Plan Selected Details</SectionTitle>
                <p className="text-sm text-gray-500 py-2">No plan selected yet.</p>
              </>
            )}

            {/* ── Documents ─────────────────────────────────────────────── */}
            <SectionTitle>Documents</SectionTitle>
            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="flex items-center justify-between border border-gray-100 rounded p-3">
                <span className="text-sm text-gray-600">Policy PDF</span>
                {pdfStatus?.policy_pdf_path
                  ? <button
                      onClick={() => downloadFile('policies', lead.id, `policy-ODE00${lead.id}.pdf`)}
                      className="text-xs text-blue-600 hover:underline">↓ Download</button>
                  : <button onClick={() => generatePdf.mutate('policy')} disabled={generatePdf.isPending}
                      className="text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50 disabled:opacity-40">Generate</button>}
              </div>
              <div className="flex items-center justify-between border border-gray-100 rounded p-3">
                <span className="text-sm text-gray-600">Receipt PDF</span>
                {pdfStatus?.receipt_pdf_path
                  ? <button
                      onClick={() => downloadFile('receipts', lead.id, `receipt-ODE00${lead.id}.pdf`)}
                      className="text-xs text-blue-600 hover:underline">↓ Download</button>
                  : <span className="text-xs text-gray-400">Not generated</span>}
              </div>
              <div className="flex items-center justify-between border border-gray-100 rounded p-3">
                <span className="text-sm text-gray-600">COI</span>
                {pdfStatus?.coi_pdf_path
                  ? <button
                      onClick={() => downloadFile('cois', lead.id, `coi-ODE00${lead.id}.pdf`)}
                      className="text-xs text-blue-600 hover:underline">↓ Download</button>
                  : <button onClick={() => generatePdf.mutate('coi')} disabled={generatePdf.isPending}
                      className="text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50 disabled:opacity-40">Generate</button>}
              </div>
            </div>

            {/* DocuSign */}
            <div className="flex items-center gap-3 py-2">
              <span className="text-sm font-semibold text-gray-700">E-Signature (DocuSign):</span>
              {!docuSign || docuSign.status === null ? (
                <button onClick={() => sendEnvelope.mutate()} disabled={sendEnvelope.isPending}
                  className="text-xs bg-[#105778] text-white px-3 py-1.5 rounded hover:bg-[#0b3f57] disabled:opacity-40">
                  {sendEnvelope.isPending ? 'Sending…' : 'Send for Signature'}
                </button>
              ) : docuSign.status === 'completed' ? (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium">✓ Signed</span>
              ) : (
                <>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${docuSign.status === 'declined' || docuSign.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                    {docuSign.status}
                  </span>
                  <button onClick={() => sendEnvelope.mutate()} disabled={sendEnvelope.isPending}
                    className="text-xs border border-[#105778] text-[#105778] px-3 py-1.5 rounded hover:bg-[#105778]/5 disabled:opacity-40">Resend</button>
                </>
              )}
            </div>

            {/* ── Assigned Agents ───────────────────────────────────────── */}
            <SectionTitle action={<BadgeBtn onClick={() => setAssignModalOpen(true)}>+ Assign</BadgeBtn>}>
              Assigned Agents
            </SectionTitle>
            {(assignments?.assignees ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No agents assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2 py-2">
                {(assignments?.assignees ?? []).map(a => (
                  <div key={a.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                    <span className="text-sm font-medium text-gray-700">{a.first_name} {a.last_name}</span>
                    {a.role_name && <span className="text-xs text-gray-400">({a.role_name})</span>}
                    <button type="button" onClick={() => unassignUser.mutate(a.id)} disabled={unassignUser.isPending}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none ml-1">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Closing Reason ────────────────────────────────────────── */}
            <SectionTitle>Closing Reason</SectionTitle>
            <textarea
              key={lead.closing_reason ?? ''}
              defaultValue={lead.closing_reason ?? ''}
              rows={2}
              placeholder="Optional — reason for closing this lead"
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              onBlur={e => {
                const val = e.target.value.trim()
                if (val !== (lead.closing_reason ?? '')) patch.mutate({ closing_reason: val || null })
              }}
            />

          </div>{/* end panel-body */}
        </div>{/* end panel */}

        {/* ══ ADD LEAD NOTES ══════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded p-5">
          <h4 className="text-base font-bold text-gray-800 mb-4">Add Lead Notes</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
            <textarea ref={noteRef} value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <div className="flex justify-end">
            <button type="button" disabled={!noteText.trim() || addNote.isPending}
              onClick={() => { if (noteText.trim()) addNote.mutate(noteText.trim()) }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-40">
              {addNote.isPending ? 'Adding…' : 'Add Notes'}
            </button>
          </div>
        </div>

        {/* ══ LEAD NOTES TABLE ════════════════════════════════════════════ */}
        {(lead.notes ?? []).length > 0 && (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <h3 className="text-base font-semibold text-gray-800 px-5 py-3 border-b border-gray-200">Lead Notes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Added By</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Added For</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(lead.notes ?? []).map(note => (
                    <tr key={note.id} className="even:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {note.author ? `${note.author.first_name} ${note.author.last_name}` : 'System'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{note.added_for ?? 'System'}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap max-w-sm">{note.message}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(note.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ SENT INVOICES ═══════════════════════════════════════════════ */}
        {(lead.invoices ?? []).length > 0 && (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <h3 className="text-base font-semibold text-gray-800 px-5 py-3 border-b border-gray-200">Sent Invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">To</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(lead.invoices ?? []).map(inv => (
                    <tr key={inv.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{inv.id}</td>
                      <td className="px-4 py-3 text-gray-700">{v(inv.email)}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{v(inv.email_subject)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {inv.total_payable != null ? `$${Number(inv.total_payable).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${inv.invoice_status === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.invoice_status === 1 ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDateTime(inv.created_at)}</td>
                      <td className="px-4 py-3">
                        {inv.encode_id && (
                          <a href={`/invoice/${inv.encode_id}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline">View</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ ACTIVITY TIMELINE ═══════════════════════════════════════════ */}
        <ActivityTimeline actions={lead.actions ?? []} />

      </div>{/* end space-y-4 */}

      {/* ══ ASSIGN MODAL ════════════════════════════════════════════════ */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Lead">
        <div className="px-5 py-4">
          {(assignments?.assignees ?? []).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Currently Assigned</p>
              <div className="space-y-2">
                {(assignments?.assignees ?? []).map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.first_name} {a.last_name}</p>
                      <p className="text-xs text-gray-400">{a.role_name}</p>
                    </div>
                    <button type="button" onClick={() => unassignUser.mutate(a.id)} disabled={unassignUser.isPending}
                      className="text-red-400 hover:text-red-600 text-sm font-medium disabled:opacity-40">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {unassignedUsers.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Assignee</p>
              <div className="flex gap-2">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">Select a user…</option>
                  {unassignedUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role_name})</option>
                  ))}
                </select>
                <button type="button" onClick={() => { if (selectedUserId !== '') assignUser.mutate(selectedUserId as number) }}
                  disabled={selectedUserId === '' || assignUser.isPending}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded disabled:opacity-40">
                  {assignUser.isPending ? '…' : 'Assign'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">All users already assigned.</p>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button type="button" onClick={() => setAssignModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Done</button>
        </div>
      </Modal>

      {/* ══ REFERRER MODAL ══════════════════════════════════════════════ */}
      <Modal open={referrerOpen} onClose={() => setReferrerOpen(false)} title={referralUser ? 'Edit Referrer' : 'Add Referrer'}>
        <div className="px-5 py-4">
          {referralUser && (
            <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{referralUser.first_name} {referralUser.last_name}</p>
                <p className="text-xs text-gray-400">{referralUser.email}</p>
              </div>
              <button type="button" onClick={removeReferrer} disabled={patch.isPending}
                className="text-red-400 hover:text-red-600 text-sm font-medium disabled:opacity-40">Remove</button>
            </div>
          )}
          <FormField label="Referrer type">
            <select value={referrerRole} onChange={e => setReferrerRole(e.target.value as 'affiliate' | 'planner' | 'customer')} className={inputCls}>
              <option value="affiliate">Affiliate</option>
              <option value="planner">Planner / Venue</option>
              <option value="customer">Customer</option>
            </select>
          </FormField>
          <FormField label="Search by name or email">
            <input value={referrerSearch} onChange={e => setReferrerSearch(e.target.value)} placeholder="Type at least 2 characters…" className={inputCls} />
          </FormField>
          <div className="max-h-56 overflow-y-auto border border-gray-100 rounded">
            {referrerSearch.trim().length < 2 ? (
              <p className="text-sm text-gray-400 px-3 py-3">Start typing to search {referrerRole}s.</p>
            ) : referrerCandidates.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-3">No matching {referrerRole}s.</p>
            ) : referrerCandidates.map(u => (
              <button key={u.id} type="button" onClick={() => setReferrer(u.id)} disabled={patch.isPending}
                className="w-full text-left px-3 py-2 hover:bg-green-50 border-b border-gray-50 last:border-0 disabled:opacity-40">
                <p className="text-sm font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button type="button" onClick={() => setReferrerOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Done</button>
        </div>
      </Modal>

      {/* ══ UPDATE PLAN MODAL ════════════════════════════════════════════ */}
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Update Plan">
        <div className="px-5 py-4">
          <FormField label="Carrier">
            <select value={planForm.carrier} onChange={e => setPlanForm(f => ({ ...f, carrier: e.target.value }))} className={inputCls}>
              <option value="">Select carrier…</option>
              <option value="ASI">ASI</option>
              <option value="FDEAN">FDEAN</option>
              <option value="IH">IH</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Min limit (M)"><input type="number" value={planForm.min_limit} onChange={e => setPlanForm(f => ({ ...f, min_limit: e.target.value }))} className={inputCls} /></FormField>
            <FormField label="Max limit (M)"><input type="number" value={planForm.max_limit} onChange={e => setPlanForm(f => ({ ...f, max_limit: e.target.value }))} className={inputCls} /></FormField>
            <FormField label="Premium"><input type="number" value={planForm.premium} onChange={e => setPlanForm(f => ({ ...f, premium: e.target.value }))} className={inputCls} /></FormField>
            <FormField label="Broker fee"><input type="number" value={planForm.broker_fee} onChange={e => setPlanForm(f => ({ ...f, broker_fee: e.target.value }))} className={inputCls} /></FormField>
            <FormField label="Processing fee"><input type="number" value={planForm.processing_fee} onChange={e => setPlanForm(f => ({ ...f, processing_fee: e.target.value }))} className={inputCls} /></FormField>
            <FormField label="Total"><input type="number" value={planForm.total} onChange={e => setPlanForm(f => ({ ...f, total: e.target.value }))} className={inputCls} /></FormField>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setPlanOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={savePlan} disabled={patch.isPending} className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white font-medium rounded disabled:opacity-40">{patch.isPending ? 'Saving…' : 'Save Plan'}</button>
        </div>
      </Modal>

      {/* ══ UPLOAD FILE MODAL ═══════════════════════════════════════════ */}
      <Modal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload File">
        <div className="px-5 py-4">
          <FormField label="Title" required>
            <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)}
              className={inputCls} placeholder="File title" />
          </FormField>
          <FormField label="Category" required>
            <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className={inputCls}>
              {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="File" required>
            <input ref={fileInputRef} type="file" className={inputCls}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUploadFile(e.target.files?.[0] ?? null)} />
          </FormField>
          <FormField label="Comments">
            <textarea value={uploadComments} onChange={e => setUploadComments(e.target.value)}
              rows={3} className={inputCls} placeholder="Optional comments" />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={uploadToCustomer} onChange={e => setUploadToCustomer(e.target.checked)}
              className="rounded border-gray-300 text-green-500" />
            Upload to Customer Portal
          </label>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setUploadModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button"
            disabled={!uploadName.trim() || !uploadFile || uploadFileMutation.isPending}
            onClick={() => uploadFileMutation.mutate()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded disabled:opacity-40">
            {uploadFileMutation.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* ══ FOLLOW UP MODAL ═════════════════════════════════════════════ */}
      <Modal open={followUpOpen} onClose={() => setFollowUpOpen(false)} title="Follow Up Lead">
        <div className="px-5 py-4">
          <FormField label="Date" required>
            <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Note" required>
            <textarea value={fuNote} onChange={e => setFuNote(e.target.value)} rows={3}
              className={inputCls} placeholder="Enter follow-up note…" />
          </FormField>
          <FormField label="Assign To" required>
            <select value={fuUserId} onChange={e => setFuUserId(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
              <option value="">Select user…</option>
              {assignableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role_name})</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setFollowUpOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button"
            disabled={!fuDate || !fuNote.trim() || !fuUserId || createFollowUp.isPending}
            onClick={() => createFollowUp.mutate()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded disabled:opacity-40">
            {createFollowUp.isPending ? 'Saving…' : 'Create Follow Up'}
          </button>
        </div>
      </Modal>

      {/* ══ SEND EMAIL MODAL ════════════════════════════════════════════ */}
      <Modal open={sendEmailOpen} onClose={() => setSendEmailOpen(false)} title="Send Email" width="max-w-2xl">
        <div className="px-5 py-4">
          <FormField label="To" required>
            <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className={inputCls} placeholder="recipient@email.com" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cc">
              <input type="text" value={emailCc} onChange={e => setEmailCc(e.target.value)} className={inputCls} placeholder="cc@email.com" />
            </FormField>
            <FormField label="Bcc">
              <input type="text" value={emailBcc} onChange={e => setEmailBcc(e.target.value)} className={inputCls} placeholder="bcc@email.com" />
            </FormField>
          </div>
          <FormField label="Subject" required>
            <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className={inputCls} placeholder="Email subject" />
          </FormField>
          <FormField label="Message" required>
            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6}
              className={inputCls} placeholder="Write your message here…" />
          </FormField>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setSendEmailOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button"
            disabled={!emailTo || !emailSubject.trim() || !emailBody.trim() || sendEmailMutation.isPending}
            onClick={() => sendEmailMutation.mutate()}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded disabled:opacity-40">
            {sendEmailMutation.isPending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </Modal>

      {/* ══ CALL DISPOSITION MODAL ══════════════════════════════════════ */}
      <Modal open={callDispOpen} onClose={() => setCallDispOpen(false)} title="Call Disposition">
        <div className="px-5 py-4">
          <FormField label="Call Notes" required>
            <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={4}
              className={inputCls} placeholder="Enter call disposition notes…" />
          </FormField>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setCallDispOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={!callNotes.trim() || addCallNote.isPending}
            onClick={() => addCallNote.mutate()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-40">
            {addCallNote.isPending ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      </Modal>

      {/* ══ DELETE CONFIRM MODAL ════════════════════════════════════════ */}
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete Lead" width="max-w-sm">
        <div className="px-5 py-5">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete lead <strong>ODE00{lead.id}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteConfirmOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={deleteLead.isPending} onClick={() => deleteLead.mutate()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded disabled:opacity-40">
            {deleteLead.isPending ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </Modal>

      {/* ══ EDIT LEAD MODAL ═════════════════════════════════════════════ */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Lead — ODE00${lead.id}`} width="max-w-3xl">
        <div className="px-5 py-4 overflow-y-auto max-h-[75vh] space-y-6">

          {/* Billing / Contact */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billing / Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name"><input className={inputCls} value={editFields.first_name ?? ''} onChange={e => setEditField('first_name', e.target.value)} /></FormField>
              <FormField label="Last Name"><input className={inputCls} value={editFields.last_name ?? ''} onChange={e => setEditField('last_name', e.target.value)} /></FormField>
              <FormField label="Email"><input type="email" className={inputCls} value={editFields.email ?? ''} onChange={e => setEditField('email', e.target.value)} /></FormField>
              <FormField label="Phone"><input className={inputCls} value={editFields.phone ?? ''} onChange={e => setEditField('phone', e.target.value)} /></FormField>
              <FormField label="Street"><input className={inputCls} value={editFields.street ?? ''} onChange={e => setEditField('street', e.target.value)} /></FormField>
              <FormField label="City"><input className={inputCls} value={editFields.city ?? ''} onChange={e => setEditField('city', e.target.value)} /></FormField>
              <FormField label="State (2-letter)"><input className={inputCls} maxLength={2} value={editFields.event_state ?? ''} onChange={e => setEditField('event_state', e.target.value.toUpperCase())} /></FormField>
              <FormField label="Zip"><input className={inputCls} value={editFields.zip ?? ''} onChange={e => setEditField('zip', e.target.value)} /></FormField>
            </div>
          </div>

          {/* Event */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Event</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Event Name"><input className={inputCls} value={editFields.event_name ?? ''} onChange={e => setEditField('event_name', e.target.value)} /></FormField>
              <FormField label="Event Date"><input type="date" className={inputCls} value={editFields.event_date ?? ''} onChange={e => setEditField('event_date', e.target.value)} /></FormField>
              <FormField label="No. of Guests"><input type="number" className={inputCls} value={editFields.no_of_people ?? ''} onChange={e => setEditField('no_of_people', e.target.value ? Number(e.target.value) : null as unknown as number)} /></FormField>
              <FormField label="Alcohol Served">
                <select className={inputCls} value={editFields.alcohol_served ?? ''} onChange={e => setEditField('alcohol_served', e.target.value)}>
                  <option value="">None</option>
                  <option value="hosted">Hosted (free)</option>
                  <option value="sold">Cash Bar (sold)</option>
                  <option value="BYOB">BYOB</option>
                  <option value="none">No Alcohol</option>
                </select>
              </FormField>
              <div className="col-span-2">
                <FormField label="Event Description"><textarea rows={3} className={inputCls} value={editFields.event_description ?? ''} onChange={e => setEditField('event_description', e.target.value)} /></FormField>
              </div>
              <div className="col-span-2 flex flex-wrap gap-4">
                {([
                  ['special_activities', 'Special Activities'],
                  ['bouncehouses',       'Bouncehouses'],
                  ['vendor_activity',    'Vendor Activity'],
                  ['private_residence',  'Private Residence'],
                ] as const).map(([k, lbl]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={!!editFields[k]}
                      onChange={e => setEditField(k, e.target.checked)} />
                    {lbl}
                  </label>
                ))}
              </div>
              {editFields.special_activities && (
                <div className="col-span-2">
                  <FormField label="Special Activity Detail"><input className={inputCls} value={editFields.event_special_act_detail ?? ''} onChange={e => setEditField('event_special_act_detail', e.target.value)} /></FormField>
                </div>
              )}
              <div className="col-span-2">
                <FormField label="Any Claims?"><input className={inputCls} value={editFields.any_claims ?? ''} onChange={e => setEditField('any_claims', e.target.value)} /></FormField>
              </div>
            </div>
          </div>

          {/* Insured */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Insured Details</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="First Name"><input className={inputCls} value={editFields.ins_first_name ?? ''} onChange={e => setEditField('ins_first_name', e.target.value)} /></FormField>
              <FormField label="Last Name"><input className={inputCls} value={editFields.ins_last_name ?? ''} onChange={e => setEditField('ins_last_name', e.target.value)} /></FormField>
              <FormField label="Street"><input className={inputCls} value={editFields.ins_street ?? ''} onChange={e => setEditField('ins_street', e.target.value)} /></FormField>
              <FormField label="City"><input className={inputCls} value={editFields.ins_city ?? ''} onChange={e => setEditField('ins_city', e.target.value)} /></FormField>
              <FormField label="State"><input className={inputCls} maxLength={2} value={editFields.ins_state ?? ''} onChange={e => setEditField('ins_state', e.target.value.toUpperCase())} /></FormField>
              <FormField label="Zip"><input className={inputCls} value={editFields.ins_zip ?? ''} onChange={e => setEditField('ins_zip', e.target.value)} /></FormField>
            </div>
          </div>

          {/* Venue */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Venue</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><FormField label="Venue Name"><input className={inputCls} value={editFields.venue_name ?? ''} onChange={e => setEditField('venue_name', e.target.value)} /></FormField></div>
              <FormField label="Address"><input className={inputCls} value={editFields.venue_address ?? ''} onChange={e => setEditField('venue_address', e.target.value)} /></FormField>
              <FormField label="State"><input className={inputCls} maxLength={2} value={editFields.venue_state ?? ''} onChange={e => setEditField('venue_state', e.target.value.toUpperCase())} /></FormField>
              <FormField label="Zip"><input className={inputCls} value={editFields.venue_zip ?? ''} onChange={e => setEditField('venue_zip', e.target.value)} /></FormField>
              <FormField label="Contact at Venue"><input className={inputCls} value={editFields.contact_at_venue ?? ''} onChange={e => setEditField('contact_at_venue', e.target.value)} /></FormField>
              <FormField label="Venue Email"><input type="email" className={inputCls} value={editFields.venue_contact_email ?? ''} onChange={e => setEditField('venue_contact_email', e.target.value)} /></FormField>
              <FormField label="Venue Phone"><input className={inputCls} value={editFields.venue_contact_number ?? ''} onChange={e => setEditField('venue_contact_number', e.target.value)} /></FormField>
            </div>
          </div>

          {/* Coverage */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Coverage</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Carrier"><input className={inputCls} value={editFields.carrier ?? ''} onChange={e => setEditField('carrier', e.target.value)} /></FormField>
              <FormField label="Coverage Limit"><input className={inputCls} value={editFields.coverage_limit ?? ''} onChange={e => setEditField('coverage_limit', e.target.value)} /></FormField>
              <div className="col-span-2"><FormField label="Additional Insured"><textarea rows={2} className={inputCls} value={editFields.additional_insured ?? ''} onChange={e => setEditField('additional_insured', e.target.value)} /></FormField></div>
              <div className="col-span-2 flex flex-wrap gap-4">
                {([
                  ['waiver_sub_status', 'Waiver of Subrogation'],
                  ['hired_status',      'Non-Owned / Hired Auto'],
                  ['primary_basis',     'Primary / Non-Contributory'],
                ] as const).map(([k, lbl]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded" checked={!!editFields[k]}
                      onChange={e => setEditField(k, e.target.checked)} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={() => setEditOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={editLeadMutation.isPending} onClick={() => editLeadMutation.mutate(editFields)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-40">
            {editLeadMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* ══ COI WIZARD MODAL ════════════════════════════════════════════ */}
      {coiWizardOpen && coiFields && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">Create COI — ODE00{lead.id}</h2>
              <button type="button" onClick={() => setCoiWizardOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center px-5 py-3 bg-gray-50 border-b border-gray-200 gap-2">
              {COI_STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 flex-1">
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                    i < coiStep ? 'bg-green-500 text-white' : i === coiStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className={`text-xs font-medium truncate ${i === coiStep ? 'text-green-700' : i < coiStep ? 'text-green-500' : 'text-gray-400'}`}>{s}</span>
                  {i < COI_STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
                </div>
              ))}
            </div>

            {/* Step body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">

              {/* ── Step 1: Producer ──────────────────────────────────── */}
              {coiStep === 0 && (
                <div className="space-y-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Agency / Producer Info</p>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Application Date">
                      <input type="date" className={inputCls} value={coiFields.application_date}
                        onChange={e => setCoiField('application_date', e.target.value)} />
                    </FormField>
                    <FormField label="Agency Name">
                      <input className={inputCls} value={coiFields.agency_name}
                        onChange={e => setCoiField('agency_name', e.target.value)} />
                    </FormField>
                    <FormField label="Street Address">
                      <input className={inputCls} value={coiFields.agency_address}
                        onChange={e => setCoiField('agency_address', e.target.value)} />
                    </FormField>
                    <FormField label="City">
                      <input className={inputCls} value={coiFields.agency_city}
                        onChange={e => setCoiField('agency_city', e.target.value)} />
                    </FormField>
                    <FormField label="State">
                      <input className={inputCls} maxLength={2} value={coiFields.agency_state}
                        onChange={e => setCoiField('agency_state', e.target.value.toUpperCase())} />
                    </FormField>
                    <FormField label="Zip">
                      <input className={inputCls} value={coiFields.agency_zipcode}
                        onChange={e => setCoiField('agency_zipcode', e.target.value)} />
                    </FormField>
                    <FormField label="Contact Name">
                      <input className={inputCls} value={coiFields.contact_name}
                        onChange={e => setCoiField('contact_name', e.target.value)} />
                    </FormField>
                    <FormField label="Phone">
                      <input className={inputCls} value={coiFields.contact_phone}
                        onChange={e => setCoiField('contact_phone', e.target.value)} />
                    </FormField>
                    <FormField label="Fax">
                      <input className={inputCls} value={coiFields.contact_fax}
                        onChange={e => setCoiField('contact_fax', e.target.value)} />
                    </FormField>
                    <FormField label="Email">
                      <input type="email" className={inputCls} value={coiFields.contact_email}
                        onChange={e => setCoiField('contact_email', e.target.value)} />
                    </FormField>
                  </div>
                </div>
              )}

              {/* ── Step 2: Insurer ───────────────────────────────────── */}
              {coiStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Insured</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="Full Name">
                          <input className={inputCls} value={coiFields.insured_name}
                            onChange={e => setCoiField('insured_name', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Street Address">
                        <input className={inputCls} value={coiFields.insured_address}
                          onChange={e => setCoiField('insured_address', e.target.value)} />
                      </FormField>
                      <FormField label="City">
                        <input className={inputCls} value={coiFields.insured_city}
                          onChange={e => setCoiField('insured_city', e.target.value)} />
                      </FormField>
                      <FormField label="State">
                        <input className={inputCls} maxLength={2} value={coiFields.insured_state}
                          onChange={e => setCoiField('insured_state', e.target.value.toUpperCase())} />
                      </FormField>
                      <FormField label="Zip">
                        <input className={inputCls} value={coiFields.insured_zipcode}
                          onChange={e => setCoiField('insured_zipcode', e.target.value)} />
                      </FormField>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Insurance Companies (A – F)</p>
                    {(['a','b','c','d','e','f'] as const).map(letter => (
                      <div key={letter} className="grid grid-cols-[1.5rem_1fr_8rem] gap-2 items-end mb-2">
                        <span className="text-xs font-bold text-gray-500 pb-2">{letter.toUpperCase()}</span>
                        <FormField label={letter === 'a' ? 'Insurer Name' : ''}>
                          <input className={inputCls}
                            value={coiFields[`insurance_${letter}` as keyof CoiFields] as string}
                            onChange={e => setCoiField(`insurance_${letter}` as keyof CoiFields, e.target.value)} />
                        </FormField>
                        <FormField label={letter === 'a' ? 'NAIC #' : ''}>
                          <input className={inputCls}
                            value={coiFields[`naic_insurer_${letter}` as keyof CoiFields] as string}
                            onChange={e => setCoiField(`naic_insurer_${letter}` as keyof CoiFields, e.target.value)} />
                        </FormField>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 3: Coverages ─────────────────────────────────── */}
              {coiStep === 2 && (
                <div className="space-y-6">

                  {/* ── Certificate header ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Certificate Number">
                      <input className={inputCls} value={coiFields.certificate_number}
                        onChange={e => setCoiField('certificate_number', e.target.value)} />
                    </FormField>
                    <FormField label="Revision Number">
                      <input className={inputCls} value={coiFields.revision_number}
                        onChange={e => setCoiField('revision_number', e.target.value)} />
                    </FormField>
                  </div>

                  {/* ── Commercial General Liability ── */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commercial General Liability</p>

                    <div className="flex flex-wrap gap-5">
                      {([
                        ['commercial_general_liability', 'Commercial General Liability'],
                        ['occur',                        'Occurrence Basis (OCCUR)'],
                        ['host_liqour',                  'Host Liquor Liability'],
                        ['commercial_gl_addl_insd',      'Additional Insured'],
                        ['commercial_gl_subr_wvd',       'Waiver of Subrogation'],
                      ] as const).map(([k, lbl]) => (
                        <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" className="rounded" checked={coiFields[k] as boolean}
                            onChange={e => setCoiField(k, e.target.checked)} />
                          {lbl}
                        </label>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2">Gen'l Aggregate Limit Applies Per</p>
                      <div className="flex gap-5">
                        {([['policy','Policy'],['pro_ject','Pro-Ject'],['loc','LOC'],['other','Other']] as const).map(([k, lbl]) => (
                          <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input type="checkbox" className="rounded" checked={coiFields[k]}
                              onChange={e => setCoiField(k, e.target.checked)} />
                            {lbl}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="Policy Number">
                          <input className={inputCls} value={coiFields.commercial_gl_policy_number}
                            onChange={e => setCoiField('commercial_gl_policy_number', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Effective Date (MM/DD/YYYY)">
                        <input className={inputCls} placeholder="04/30/2026" value={coiFields.commercial_gl_policy_eff}
                          onChange={e => setCoiField('commercial_gl_policy_eff', e.target.value)} />
                      </FormField>
                      <FormField label="Expiration Date (MM/DD/YYYY)">
                        <input className={inputCls} placeholder="05/01/2026" value={coiFields.commercial_gl_policy_exp}
                          onChange={e => setCoiField('commercial_gl_policy_exp', e.target.value)} />
                      </FormField>
                    </div>

                    <p className="text-xs font-semibold text-gray-400">Coverage Limits</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Each Occurrence">
                        <input className={inputCls} value={coiFields.commercial_gl_each_occurrence}
                          onChange={e => setCoiField('commercial_gl_each_occurrence', e.target.value)} />
                      </FormField>
                      <FormField label="General Aggregate">
                        <input className={inputCls} value={coiFields.commercial_gl_general_aggregate}
                          onChange={e => setCoiField('commercial_gl_general_aggregate', e.target.value)} />
                      </FormField>
                      <FormField label="Products / Comp-Op Aggregate">
                        <input className={inputCls} value={coiFields.commercial_gl_products_comp}
                          onChange={e => setCoiField('commercial_gl_products_comp', e.target.value)} />
                      </FormField>
                      <FormField label="Personal & Adv Injury">
                        <input className={inputCls} value={coiFields.commercial_gl_personal_adv_injury}
                          onChange={e => setCoiField('commercial_gl_personal_adv_injury', e.target.value)} />
                      </FormField>
                      <FormField label="Med Exp (Any One Person)">
                        <input className={inputCls} value={coiFields.commercial_gl_med_exp}
                          onChange={e => setCoiField('commercial_gl_med_exp', e.target.value)} />
                      </FormField>
                      <FormField label="Damage to Rented Premises">
                        <input className={inputCls} value={coiFields.commercial_gl_rented_premises}
                          onChange={e => setCoiField('commercial_gl_rented_premises', e.target.value)} />
                      </FormField>
                      <FormField label="Deductible">
                        <input className={inputCls} value={coiFields.deductible}
                          onChange={e => setCoiField('deductible', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  {/* ── Automobile Liability ── */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Automobile Liability</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="Auto Type">
                          <select className={inputCls} value={coiFields.auto_mobile_liability}
                            onChange={e => setCoiField('auto_mobile_liability', e.target.value)}>
                            <option value="">— Not Applicable —</option>
                            <option value="ANY AUTO">Any Auto</option>
                            <option value="OWNED AUTOS ONLY">Owned Autos Only</option>
                            <option value="SCHEDULED AUTOS">Scheduled Autos</option>
                            <option value="HIRED AUTOS ONLY">Hired Autos Only</option>
                            <option value="NON-OWNED AUTOS ONLY">Non-Owned Autos Only</option>
                          </select>
                        </FormField>
                      </div>
                    </div>

                    <div className="flex gap-5">
                      {([
                        ['auto_mobile_liability_addl_insd', 'Additional Insured'],
                        ['auto_mobile_liability_subr_wvd',  'Waiver of Subrogation'],
                      ] as const).map(([k, lbl]) => (
                        <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" className="rounded" checked={coiFields[k]}
                            onChange={e => setCoiField(k, e.target.checked)} />
                          {lbl}
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="Policy Number">
                          <input className={inputCls} value={coiFields.auto_mobile_policy_number}
                            onChange={e => setCoiField('auto_mobile_policy_number', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Effective Date (MM/DD/YYYY)">
                        <input className={inputCls} value={coiFields.auto_mobile_policy_eff}
                          onChange={e => setCoiField('auto_mobile_policy_eff', e.target.value)} />
                      </FormField>
                      <FormField label="Expiration Date (MM/DD/YYYY)">
                        <input className={inputCls} value={coiFields.auto_mobile_policy_exp}
                          onChange={e => setCoiField('auto_mobile_policy_exp', e.target.value)} />
                      </FormField>
                      <FormField label="Combined Single Limit">
                        <input className={inputCls} value={coiFields.combined_single_limit}
                          onChange={e => setCoiField('combined_single_limit', e.target.value)} />
                      </FormField>
                      <FormField label="Bodily Injury (Per Person)">
                        <input className={inputCls} value={coiFields.bodily_injury_per_person}
                          onChange={e => setCoiField('bodily_injury_per_person', e.target.value)} />
                      </FormField>
                      <FormField label="Bodily Injury (Per Accident)">
                        <input className={inputCls} value={coiFields.bodily_injury_per_accident}
                          onChange={e => setCoiField('bodily_injury_per_accident', e.target.value)} />
                      </FormField>
                      <FormField label="Property Damage (Per Accident)">
                        <input className={inputCls} value={coiFields.property_damage_per_accident}
                          onChange={e => setCoiField('property_damage_per_accident', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  {/* ── Umbrella / Excess Liability ── */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Umbrella / Excess Liability</p>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Umbrella Liab">
                        <select className={inputCls} value={coiFields.umbrella_liab}
                          onChange={e => setCoiField('umbrella_liab', e.target.value)}>
                          <option value="">— Not Applicable —</option>
                          <option value="UMBRELLA LIAB">Umbrella Liab</option>
                          <option value="OCCUR">Umbrella Liab + Occur</option>
                        </select>
                      </FormField>
                      <FormField label="Excess Liab">
                        <select className={inputCls} value={coiFields.excess_liab}
                          onChange={e => setCoiField('excess_liab', e.target.value)}>
                          <option value="">— Not Applicable —</option>
                          <option value="EXCESS LIAB">Excess Liab</option>
                          <option value="CLAIMS-MADE">Excess Liab + Claims-Made</option>
                        </select>
                      </FormField>
                    </div>

                    <div className="flex gap-5">
                      {([
                        ['umbrella_or_excess_addl_insd', 'Additional Insured'],
                        ['excluded_subr_wvd',             'Waiver of Subrogation'],
                      ] as const).map(([k, lbl]) => (
                        <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input type="checkbox" className="rounded" checked={coiFields[k]}
                            onChange={e => setCoiField(k, e.target.checked)} />
                          {lbl}
                        </label>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="DED / Retention">
                        <select className={inputCls} value={coiFields.ded_or_retention}
                          onChange={e => setCoiField('ded_or_retention', e.target.value)}>
                          <option value="">— None —</option>
                          <option value="DED">DED</option>
                          <option value="RETENTION">Retention</option>
                        </select>
                      </FormField>
                      <FormField label="Retention Amount $">
                        <input className={inputCls} value={coiFields.retention_amount}
                          onChange={e => setCoiField('retention_amount', e.target.value)} />
                      </FormField>
                      <div className="col-span-2">
                        <FormField label="Policy Number">
                          <input className={inputCls} value={coiFields.umbrella_or_excess_policy_number}
                            onChange={e => setCoiField('umbrella_or_excess_policy_number', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Effective Date (MM/DD/YYYY)">
                        <input className={inputCls} value={coiFields.umbrella_or_excess_policy_eff}
                          onChange={e => setCoiField('umbrella_or_excess_policy_eff', e.target.value)} />
                      </FormField>
                      <FormField label="Expiration Date (MM/DD/YYYY)">
                        <input className={inputCls} value={coiFields.umbrella_or_excess_policy_exp}
                          onChange={e => setCoiField('umbrella_or_excess_policy_exp', e.target.value)} />
                      </FormField>
                      <FormField label="Each Occurrence">
                        <input className={inputCls} value={coiFields.umbrella_each_occurrence}
                          onChange={e => setCoiField('umbrella_each_occurrence', e.target.value)} />
                      </FormField>
                      <FormField label="Aggregate">
                        <input className={inputCls} value={coiFields.umbrella_aggregate}
                          onChange={e => setCoiField('umbrella_aggregate', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  {/* ── Workers Compensation ── */}
                  <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workers Compensation & Employers Liability</p>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Statute Type">
                        <select className={inputCls} value={coiFields.statute}
                          onChange={e => setCoiField('statute', e.target.value)}>
                          <option value="">— Not Applicable —</option>
                          <option value="PER STATUTE">Per Statute</option>
                          <option value="OTH-ER">Other</option>
                        </select>
                      </FormField>
                      <FormField label="Any Proprietor/Partner/Exec Officer Excluded? (Y/N)">
                        <select className={inputCls} value={coiFields.workers_compensation}
                          onChange={e => setCoiField('workers_compensation', e.target.value)}>
                          <option value="">—</option>
                          <option value="Y">Yes</option>
                          <option value="N">No</option>
                        </select>
                      </FormField>
                      <div className="col-span-2">
                        <FormField label="Policy Number">
                          <input className={inputCls} value={coiFields.workers_compensation_policy_number}
                            onChange={e => setCoiField('workers_compensation_policy_number', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="E.L. Each Accident">
                        <input className={inputCls} value={coiFields.workers_compensation_each_accident}
                          onChange={e => setCoiField('workers_compensation_each_accident', e.target.value)} />
                      </FormField>
                      <FormField label="E.L. Disease – EA Employee">
                        <input className={inputCls} value={coiFields.workers_compensation_disease_employee}
                          onChange={e => setCoiField('workers_compensation_disease_employee', e.target.value)} />
                      </FormField>
                      <FormField label="E.L. Disease – Policy Limit">
                        <input className={inputCls} value={coiFields.workers_compensation_disease_policy_limit}
                          onChange={e => setCoiField('workers_compensation_disease_policy_limit', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                </div>
              )}

              {/* ── Step 4: Finish ────────────────────────────────────── */}
              {coiStep === 3 && (
                <div className="space-y-5">
                  <FormField label="Description of Operations / Locations / Vehicles">
                    <textarea rows={4} className={inputCls} value={coiFields.description_of_operations}
                      onChange={e => setCoiField('description_of_operations', e.target.value)} />
                  </FormField>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Certificate Holder</p>
                      <div className="flex gap-2">
                        <button type="button"
                          className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          onClick={() => setCoiFields(prev => prev ? { ...prev,
                            certificate_holder_name:    [lead.venue_name].filter(Boolean).join(''),
                            certificate_holder_address: lead.venue_address ?? '',
                            certificate_holder_city:    lead.city ?? '',
                            certificate_holder_state:   lead.venue_state ?? lead.event_state ?? '',
                            certificate_holder_zipcode: lead.venue_zip ?? '',
                          } : prev)}>
                          Fill from Venue
                        </button>
                        <button type="button"
                          className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          onClick={() => setCoiFields(prev => prev ? { ...prev,
                            certificate_holder_name:    [lead.ins_first_name ?? lead.first_name, lead.ins_last_name ?? lead.last_name].filter(Boolean).join(' '),
                            certificate_holder_address: lead.ins_street ?? lead.street ?? '',
                            certificate_holder_city:    lead.ins_city ?? lead.city ?? '',
                            certificate_holder_state:   lead.ins_state ?? lead.event_state ?? '',
                            certificate_holder_zipcode: lead.ins_zip ?? lead.zip ?? '',
                          } : prev)}>
                          Fill from Insured
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="Name">
                          <input className={inputCls} value={coiFields.certificate_holder_name}
                            onChange={e => setCoiField('certificate_holder_name', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Street Address">
                        <input className={inputCls} value={coiFields.certificate_holder_address}
                          onChange={e => setCoiField('certificate_holder_address', e.target.value)} />
                      </FormField>
                      <FormField label="City">
                        <input className={inputCls} value={coiFields.certificate_holder_city}
                          onChange={e => setCoiField('certificate_holder_city', e.target.value)} />
                      </FormField>
                      <FormField label="State">
                        <input className={inputCls} maxLength={2} value={coiFields.certificate_holder_state}
                          onChange={e => setCoiField('certificate_holder_state', e.target.value.toUpperCase())} />
                      </FormField>
                      <FormField label="Zip">
                        <input className={inputCls} value={coiFields.certificate_holder_zipcode}
                          onChange={e => setCoiField('certificate_holder_zipcode', e.target.value)} />
                      </FormField>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">File Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormField label="File Title">
                          <input className={inputCls} value={coiFields.coi_name}
                            onChange={e => setCoiField('coi_name', e.target.value)} />
                        </FormField>
                      </div>
                      <FormField label="Category">
                        <select className={inputCls} value={coiFields.coi_category}
                          onChange={e => setCoiField('coi_category', e.target.value)}>
                          {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </FormField>
                    </div>
                  </div>
                </div>
              )}

            </div>{/* end step body */}

            {/* Navigation footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <button type="button"
                onClick={() => coiStep > 0 ? setCoiStep(s => s - 1) : setCoiWizardOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-white">
                {coiStep === 0 ? 'Cancel' : '← Back'}
              </button>
              {coiStep < COI_STEPS.length - 1 ? (
                <button type="button"
                  onClick={() => setCoiStep(s => s + 1)}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded">
                  Next →
                </button>
              ) : (
                <button type="button"
                  disabled={generateCoiWizard.isPending}
                  onClick={() => generateCoiWizard.mutate(coiFields)}
                  className="px-5 py-2 bg-[#3CB371] hover:bg-[#2e9a5e] text-white text-sm font-semibold rounded disabled:opacity-50">
                  {generateCoiWizard.isPending ? 'Generating PDF…' : 'Generate COI'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  )
}
