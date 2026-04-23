// ─── User & Auth ────────────────────────────────────────────────────────────

export interface Role {
  id: number
  role_name: string
  access_level: number
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  status: number
  is_agency: boolean
  role: Role
  referral_string?: string | null
  w9_status?: boolean
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ─── Quote Engine ────────────────────────────────────────────────────────────

export interface EventType {
  id: number
  event_type: string
  client_added: boolean
}

export interface UsState {
  id: number
  name: string
  abbreviation: string
}

export interface PolicyLimit {
  gl_limit: string
  gl_limit_type: string
}

export interface QuotePlan {
  rate_id: number
  carrier: string
  premium: number
  broker_fee: number
  processing_fee: number
  extra_charge: number
  total: number
  min_limit: number
  max_limit: number
  recommended: boolean
  limits: PolicyLimit[]
}

export interface QuotePlans {
  firstOption: QuotePlan | null
  secondOption: QuotePlan | null
  thirdOption: QuotePlan | null
  fourthOption: QuotePlan | null
}

export interface QuoteParams {
  eventType: number
  eventTypeName: string
  eventDates: string          // comma-separated dates e.g. "04/20/2026"
  event_state: string         // full state name e.g. "California"
  number_of_persons: number
  noha: 0 | 1
  w_o_s: 0 | 1
  p_a_n_c_b: 0 | 1
  host_liquor: 0 | 1
  liquor: 0 | 1
  additional_insureds: number
  privateResidence: 0 | 1
  isSetVenue: 0 | 1
  timezone: string
}

// ─── Lead ────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'tried'
  | 'saved'
  | 'mq'
  | 'plan_added_manually'
  | 'payment'
  | 'payment_received'
  | 'finished'

export interface Lead {
  id: number
  lead_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  event_type_name: string
  event_date: string[]
  event_state: string
  no_of_people: string
  carrier: string
  coverage_limit: string
  submission_status: LeadStatus
  bound: boolean
  is_email_blocked: boolean
  created_at: string
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export interface Invoice {
  id: number
  lead_id: number
  encode_id: string
  type: 'single' | 'multiple'
  status: 'pending' | 'viewed' | 'paid'
  plans: InvoicePlan[]
  sent_at: string | null
}

export interface InvoicePlan {
  id: number
  carrier: string
  premium: number
  broker_fee: number
  total: number
  is_selected: boolean
  plan_data: Record<string, unknown>
}
