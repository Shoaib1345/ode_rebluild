import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsResponse {
  referral_string: string
  referrals: {
    total: number
    paid: number
    this_month: number
    paid_month: number
  }
  earnings: {
    total: number
    this_month: number
    total_paid_out: number
    pending_payout: number
  }
  monthly_chart: { label: string; referrals: number; paid: number; earnings: number }[]
}

interface ReferralRow {
  id: number
  first_name: string | null
  last_name: string | null
  event_type_label: string | null
  event_date: string | null
  event_state: string | null
  submission_status: string
  created_at: string
}

interface Paginated {
  data: ReferralRow[]
  current_page: number
  last_page: number
  total: number
}

interface Payout {
  id: number
  payment: string
  payment_date: string
  notes: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Section = 'home' | 'leads' | 'sales' | 'invoices' | 'claims' | 'messages' | 'profile'

const NAV_ITEMS: { label: string; key: Section }[] = [
  { label: 'Home',     key: 'home'     },
  { label: 'Leads',    key: 'leads'    },
  { label: 'Sales',    key: 'sales'    },
  { label: 'Invoices', key: 'invoices' },
  { label: 'Claims',   key: 'claims'   },
  { label: 'Messages', key: 'messages' },
  { label: 'Profile',  key: 'profile'  },
]

const STATUS_LABEL: Record<string, string> = {
  tried:               'Awaiting Quote',
  saved:               'Quote Saved',
  mq:                  'Manual Quote',
  plan_added_manually: 'Plan Added',
  payment:             'Awaiting Payment',
  payment_received:    'Paid',
  finished:            'Finished',
}

const STATUS_COLOR: Record<string, string> = {
  tried:               'text-gray-500',
  saved:               'text-yellow-600',
  mq:                  'text-orange-600',
  plan_added_manually: 'text-purple-600',
  payment:             'text-blue-600',
  payment_received:    'text-green-600',
  finished:            'text-green-700',
}

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── ODE Logo ─────────────────────────────────────────────────────────────────

function OdeLogo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/assets/images/logo-img.svg" alt="ODE" className="h-11 w-11 flex-shrink-0" />
      <div className="leading-tight">
        <p className="text-[13px] font-extrabold text-gray-800 uppercase tracking-wider">ONE DAY EVENT</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">JUST ENJOY</p>
      </div>
    </div>
  )
}

// ─── Event avatar placeholder ─────────────────────────────────────────────────

function EventAvatar() {
  return (
    <div className="w-[72px] h-[72px] flex-shrink-0 rounded-full bg-pink-100 overflow-hidden flex items-center justify-center">
      <img
        src="/assets/images/event-main.png"
        alt="event"
        className="w-full h-full object-cover object-top"
        onError={(e) => {
          const t = e.currentTarget
          t.style.display = 'none'
          if (t.parentElement) t.parentElement.innerHTML = `<span class="text-3xl">🎉</span>`
        }}
      />
    </div>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: ReferralRow }) {
  const name = [event.first_name, event.last_name].filter(Boolean).join(' ')
  const statusLabel = STATUS_LABEL[event.submission_status] ?? event.submission_status
  const statusColor = STATUS_COLOR[event.submission_status] ?? 'text-gray-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
      <div className="flex items-start gap-4">
        <EventAvatar />
        <div className="flex-1 min-w-0">
          {name && (
            <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
          )}
          {event.event_type_label && (
            <p className="text-xs text-[#1CA0DF] font-medium truncate">{event.event_type_label}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{fmtDate(event.event_date)}</p>
          <p className={`text-xs font-medium mt-0.5 ${statusColor}`}>{statusLabel}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Details
        </button>
        <button
          onClick={() => window.location.href = '/onedayevent'}
          className="flex-1 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
        >
          Requote
        </button>
      </div>
    </div>
  )
}

// ─── Home / Sales view ────────────────────────────────────────────────────────

function HomeView({ stats }: { stats: StatsResponse | undefined }) {
  const { data: allRefs } = useQuery({
    queryKey: ['affiliate-referrals-events'],
    queryFn: () =>
      api.get<Paginated>('/affiliate/referrals', { params: { per_page: 50 } }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const today = new Date().toISOString().split('T')[0]
  const past  = (allRefs?.data ?? []).filter((e) => e.event_date && e.event_date < today)
  const next  = (allRefs?.data ?? []).filter((e) => e.event_date && e.event_date >= today)

  const commissions = stats?.earnings.total ?? 0

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales</h1>

      {/* ── Top cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {/* Left card — referral snapshot */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[160px] flex flex-col justify-between">
          {stats ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Referral Overview
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total referrals</span>
                  <span className="font-semibold text-gray-800">{stats.referrals.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-semibold text-gray-800">{stats.referrals.paid}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">This month</span>
                  <span className="font-semibold text-gray-800">{stats.referrals.this_month}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 animate-pulse space-y-3">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          )}
        </div>

        {/* Right card — Commissions */}
        <div className="bg-[#1CA0DF] rounded-2xl p-6 min-h-[160px] flex flex-col">
          <p className="text-sm text-white/80 font-medium">Commisions</p>
          <div className="flex-1 flex items-end">
            <p className="text-[2.4rem] font-bold text-white leading-tight">
              $ {fmtMoney(commissions)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Events ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Previous Events */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">Previous Events</h2>
          {past.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center text-sm text-gray-400">
              No previous events
            </div>
          ) : (
            past.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </div>

        {/* Next Events */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">Next Events</h2>
          {next.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center text-sm text-gray-400">
              No upcoming events
            </div>
          ) : (
            next.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Leads view ───────────────────────────────────────────────────────────────

function LeadsView() {
  const [page, setPage] = useState(1)

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['affiliate-referrals', page],
    queryFn: () =>
      api.get<Paginated>('/affiliate/referrals', { params: { page, per_page: 20 } }).then((r) => r.data),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Leads</h1>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'Name', 'Event type', 'Event date', 'State', 'Status', 'Referred on'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                : referrals?.data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{row.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {[row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.event_type_label ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(row.event_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.event_state ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`text-xs font-medium ${STATUS_COLOR[row.submission_status] ?? 'text-gray-500'}`}>
                          {STATUS_LABEL[row.submission_status] ?? row.submission_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && referrals?.data.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              No referrals yet. Share your link to get started!
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {referrals && referrals.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <span>{referrals.total} total leads</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs">
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-gray-600">{page} / {referrals.last_page}</span>
            <button disabled={page >= referrals.last_page} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 text-xs">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sales view ───────────────────────────────────────────────────────────────

function SalesView({ stats }: { stats: StatsResponse | undefined }) {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ['affiliate-payouts'],
    queryFn: () => api.get<Payout[]>('/affiliate/payouts').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales</h1>

      {/* Earnings breakdown */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total earned',   value: `$${fmtMoney(stats.earnings.total)}` },
            { label: 'This month',     value: `$${fmtMoney(stats.earnings.this_month)}` },
            { label: 'Paid out',       value: `$${fmtMoney(stats.earnings.total_paid_out)}` },
            { label: 'Pending payout', value: `$${fmtMoney(stats.earnings.pending_payout)}` },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payouts table */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">Payout History</h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-10 text-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#1CA0DF] mx-auto" />
          </div>
        ) : payouts && payouts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Amount', 'Notes'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-green-700">${fmtMoney(Number(p.payment))}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{p.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No payouts recorded yet.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Profile view ─────────────────────────────────────────────────────────────

function ProfileView({ stats }: { stats: StatsResponse | undefined }) {
  const { user } = useAuth()
  const referralLink = `${window.location.origin}/onedayevent?ref=${user?.referral_string ?? ''}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
        <p className="text-sm text-gray-500 mb-1">Full name</p>
        <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
        <p className="text-sm text-gray-500 mt-3 mb-1">Email</p>
        <p className="text-gray-700 text-sm">{user?.email}</p>
        {user?.referral_string && (
          <>
            <p className="text-sm text-gray-500 mt-3 mb-1">Referral code</p>
            <p className="font-mono font-semibold text-gray-800">{user.referral_string}</p>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-700 mb-2">Your referral link</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-600 truncate">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Copy link
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Placeholder for unimplemented sections ────────────────────────────────────

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
      <div className="bg-white rounded-2xl border border-gray-200 px-8 py-16 text-center text-gray-400 text-sm">
        This section is coming soon.
      </div>
    </div>
  )
}

// ─── Approved portal ──────────────────────────────────────────────────────────

function AffiliatePortal() {
  const [section, setSection] = useState<Section>('home')
  const { user, logout }      = useAuth()
  const navigate              = useNavigate()

  const { data: stats } = useQuery({
    queryKey:  ['affiliate-stats'],
    queryFn:   () => api.get<StatsResponse>('/affiliate/stats').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
    toast.success('Signed out.')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-[260px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <OdeLogo />
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                section === item.key
                  ? 'bg-gray-100 border border-gray-200 font-semibold text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-normal'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors font-normal mt-2"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <header className="flex items-center justify-end px-6 py-3 bg-white border-b border-gray-100">
          <Link
            to="/onedayevent"
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-6 py-2 rounded-full transition-colors"
          >
            Get Quote
          </Link>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          {section === 'home'     && <HomeView    stats={stats} />}
          {section === 'leads'    && <LeadsView />}
          {section === 'sales'    && <SalesView   stats={stats} />}
          {section === 'invoices' && <ComingSoon title="Invoices" />}
          {section === 'claims'   && <ComingSoon title="Claims" />}
          {section === 'messages' && <ComingSoon title="Messages" />}
          {section === 'profile'  && <ProfileView stats={stats} />}
        </main>

      </div>
    </div>
  )
}

// ─── Pending / approval-status view ─────────────────────────────────────────────

function StatusStep({ state, title, desc, isLast }: { state: 'done' | 'current' | 'todo' | 'error'; title: string; desc: string; isLast?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          state === 'done'    ? 'bg-green-500 text-white' :
          state === 'current' ? 'bg-amber-400 text-white ring-4 ring-amber-100' :
          state === 'error'   ? 'bg-red-500 text-white' :
                                'bg-gray-200 text-gray-400'
        }`}>
          {state === 'done' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : state === 'error' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : state === 'current' ? (
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          ) : null}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
      </div>
      <div className={isLast ? '' : 'pb-6'}>
        <p className={`text-sm font-semibold ${state === 'todo' ? 'text-gray-400' : state === 'error' ? 'text-red-600' : 'text-gray-800'}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function AffiliateStatusView({ rejected }: { rejected?: boolean }) {
  const { user, token, setAuth, logout } = useAuth()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
    toast.success('Signed out.')
  }

  const refreshStatus = async () => {
    setRefreshing(true)
    try {
      const res  = await api.get<{ user: { status: number } }>('/auth/me')
      const fresh = res.data.user
      if (user && token) setAuth({ ...user, status: fresh.status }, token)
      if (fresh.status === 1)      toast.success("You're approved! Welcome aboard. 🎉")
      else if (fresh.status === 2) toast('Your application was not approved.', { icon: '🚫' })
      else                         toast('Still under review — we\'ll email you the moment it\'s approved.', { icon: '⏳' })
    } catch {
      toast.error('Could not refresh your status. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F3F8] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-5 h-16 flex items-center justify-between">
        <OdeLogo />
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          Sign out
        </button>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Banner */}
            {rejected ? (
              <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">Application not approved</p>
                  <h1 className="text-lg font-bold text-gray-800">Hi {user?.first_name}</h1>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Application under review</p>
                  <h1 className="text-lg font-bold text-gray-800">Hi {user?.first_name}, you're almost there!</h1>
                </div>
              </div>
            )}

            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-6">
                {rejected ? (
                  <>Unfortunately your affiliate application wasn&apos;t approved at this time. If you believe this was a mistake, please contact us at <a href="mailto:support@onedayevent.com" className="text-[#1CA0DF] font-medium underline">support@onedayevent.com</a>.</>
                ) : (
                  <>Thanks for applying to the One Day Event affiliate program. Our team is reviewing your application — we&apos;ll email you at <strong>{user?.email}</strong> the moment it&apos;s approved.</>
                )}
              </p>

              {/* Status timeline */}
              <div className="mb-2">
                <StatusStep state="done" title="Application submitted" desc="We've received your details." />
                {rejected ? (
                  <>
                    <StatusStep state="done"  title="Reviewed"     desc="Our team reviewed your application." />
                    <StatusStep state="error" title="Not approved" desc="Your application was not approved at this time." isLast />
                  </>
                ) : (
                  <>
                    <StatusStep state="current" title="Under review"      desc="Our team is reviewing your application (usually within 1–2 business days)." />
                    <StatusStep state="todo"    title="Approved & active" desc="Once approved, your full affiliate dashboard unlocks here." isLast />
                  </>
                )}
              </div>

              {/* Referral code preview — only while pending */}
              {!rejected && user?.referral_string && (
                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">Your referral code (active once approved)</p>
                  <p className="font-mono font-bold text-gray-700 tracking-wide">{user.referral_string}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={refreshStatus}
                  disabled={refreshing}
                  className="px-5 py-2.5 bg-[#1CA0DF] hover:bg-[#1786BB] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {refreshing ? 'Checking…' : 'Check status'}
                </button>
                {rejected ? (
                  <a
                    href="mailto:support@onedayevent.com"
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Contact support
                  </a>
                ) : (
                  <Link
                    to="/"
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to home
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* What you'll get — only while pending */}
          {!rejected && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { t: 'Earn commissions', d: 'Get paid for every policy from your referrals.' },
                { t: 'Track referrals',  d: 'See every lead and sale in real time.' },
                { t: 'Reliable payouts', d: 'On-time payouts straight to you.' },
              ].map((c) => (
                <div key={c.t} className="bg-white rounded-xl border border-gray-100 px-4 py-4">
                  <p className="text-sm font-semibold text-gray-800">{c.t}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AffiliateDashboard() {
  const { user } = useAuth()

  // Approved affiliates see the full portal; pending/rejected see their status.
  if (user?.status === 1) {
    return <AffiliatePortal />
  }

  return <AffiliateStatusView rejected={user?.status === 2} />
}
