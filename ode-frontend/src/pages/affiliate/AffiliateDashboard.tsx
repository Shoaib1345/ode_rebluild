import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import CommissionsTab from '../../components/commission/CommissionsTab'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthPoint {
  label: string
  referrals: number
  paid: number
  earnings: number
}

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
  monthly_chart: MonthPoint[]
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

const STATUS_BADGE: Record<string, string> = {
  tried:               'bg-gray-100 text-gray-500',
  saved:               'bg-yellow-100 text-yellow-700',
  mq:                  'bg-orange-100 text-orange-700',
  plan_added_manually: 'bg-purple-100 text-purple-700',
  payment:             'bg-[#EDF0FA] text-[#105778]',
  payment_received:    'bg-green-100 text-green-700',
  finished:            'bg-green-200 text-green-800',
}

const STATUS_LABEL: Record<string, string> = {
  tried:               'Started',
  saved:               'Saved',
  mq:                  'Manual Quote',
  plan_added_manually: 'Plan Added',
  payment:             'Awaiting Payment',
  payment_received:    'Paid ✓',
  finished:            'Finished',
}

function fmtDate(str: string | null) {
  if (!str) return '—'
  return new Date(str + (str.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl border px-5 py-5 ${accent ? 'bg-[#1CA0DF] border-[#1CA0DF]' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${accent ? 'text-white/70' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

// ─── Mini bar chart (6 months) ────────────────────────────────────────────────

function MiniChart({ data }: { data: MonthPoint[] }) {
  const maxR = Math.max(...data.map((d) => d.referrals), 1)
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => {
        const hPct = (d.referrals / maxR) * 100
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
              <div
                className="w-full rounded-t bg-[#EDF0FA]0 transition-all"
                style={{ height: `${Math.max(hPct, d.referrals > 0 ? 4 : 0)}%` }}
                title={`${d.referrals} referrals, ${fmtMoney(d.earnings)}`}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{d.label.split(' ')[0]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Header / nav ─────────────────────────────────────────────────────────────

function AffiliateHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
    toast.success('Signed out.')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-8 h-14 flex items-center justify-between">
      <span className="text-[#105778] font-bold text-lg">
        ODE <span className="text-gray-600 font-normal text-sm">Affiliate Portal</span>
      </span>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="hidden sm:inline">{user?.first_name} {user?.last_name}</span>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors text-xs">
          Sign out
        </button>
      </div>
    </header>
  )
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'referrals' | 'payouts' | 'commissions'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliateDashboard() {
  const [tab, setTab]   = useState<Tab>('overview')
  const [page, setPage] = useState(1)
  const { user }        = useAuth()

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey:  ['affiliate-stats'],
    queryFn:   () => api.get<StatsResponse>('/affiliate/stats').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  // Referrals (only fetched when on that tab)
  const { data: referrals, isLoading: refLoading } = useQuery({
    queryKey:  ['affiliate-referrals', page],
    queryFn:   () => api.get<Paginated>('/affiliate/referrals', { params: { page, per_page: 20 } }).then((r) => r.data),
    enabled:   tab === 'referrals',
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  // Payouts (only fetched when on that tab)
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey:  ['affiliate-payouts'],
    queryFn:   () => api.get<Payout[]>('/affiliate/payouts').then((r) => r.data),
    enabled:   tab === 'payouts',
    staleTime: 5 * 60 * 1000,
  })

  const referralLink = `${window.location.origin}/onedayevent?ref=${user?.referral_string ?? ''}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-[#1CA0DF] text-[#1CA0DF]'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <AffiliateHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Welcome + referral link ──────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h1 className="text-lg font-bold text-gray-800 mb-1">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Share your unique referral link to earn commissions on every completed policy.
          </p>
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
          {user?.referral_string && (
            <p className="text-xs text-gray-400 mt-2">
              Your referral code: <span className="font-mono font-semibold text-gray-600">{user.referral_string}</span>
            </p>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            <button className={tabCls('overview')}     onClick={() => setTab('overview')}>Overview</button>
            <button className={tabCls('referrals')}    onClick={() => { setTab('referrals'); setPage(1) }}>Referrals</button>
            <button className={tabCls('payouts')}      onClick={() => setTab('payouts')}>Payouts</button>
            <button className={tabCls('commissions')}  onClick={() => setTab('commissions')}>Commissions & W9</button>
          </div>
        </div>

        {/* ── Overview tab ────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {statsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 px-5 py-5 animate-pulse">
                    <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                    <div className="h-7 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total referrals"
                    value={String(stats.referrals.total)}
                    sub={`${stats.referrals.paid} completed`}
                  />
                  <StatCard
                    label="This month"
                    value={String(stats.referrals.this_month)}
                    sub={`${stats.referrals.paid_month} completed`}
                    accent
                  />
                  <StatCard
                    label="Total earned"
                    value={fmtMoney(stats.earnings.total)}
                    sub={`${fmtMoney(stats.earnings.this_month)} this month`}
                  />
                  <StatCard
                    label="Pending payout"
                    value={fmtMoney(stats.earnings.pending_payout)}
                    sub={`${fmtMoney(stats.earnings.total_paid_out)} paid out`}
                    accent={stats.earnings.pending_payout > 0}
                  />
                </div>

                {/* 6-month chart */}
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Referrals — last 6 months</h2>
                  <MiniChart data={stats.monthly_chart} />
                  <div className="mt-3 flex gap-6 text-xs text-gray-400">
                    {stats.monthly_chart.map((d) => (
                      <span key={d.label} className="flex-1 text-center">
                        {d.referrals > 0 && <span className="text-[#1CA0DF] font-medium">{d.referrals}</span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Earnings breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">Earnings breakdown</h2>
                  <div className="space-y-2 text-sm">
                    {stats.monthly_chart.filter((d) => d.earnings > 0).length === 0 ? (
                      <p className="text-gray-400 text-xs">No earnings recorded yet. Complete referrals will appear here.</p>
                    ) : (
                      stats.monthly_chart.map((d) => d.earnings > 0 && (
                        <div key={d.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-gray-500">{d.label}</span>
                          <span className="font-medium text-gray-800">{fmtMoney(d.earnings)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── Referrals tab ────────────────────────────────────────── */}
        {tab === 'referrals' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                    {refLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
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
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[row.submission_status] ?? 'bg-gray-100 text-gray-500'}`}>
                                {STATUS_LABEL[row.submission_status] ?? row.submission_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(row.created_at)}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                {!refLoading && referrals?.data.length === 0 && (
                  <div className="px-6 py-12 text-center text-sm text-gray-400">
                    No referrals yet. Share your link to get started!
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {referrals && referrals.last_page > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{referrals.total} total referrals</span>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-gray-600">
                    {page} / {referrals.last_page}
                  </span>
                  <button disabled={page >= referrals.last_page} onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Commissions & W9 tab ────────────────────────────────── */}
        {tab === 'commissions' && <CommissionsTab />}

        {/* ── Payouts tab ──────────────────────────────────────────── */}
        {tab === 'payouts' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {payoutsLoading ? (
              <div className="px-6 py-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1CA0DF] mx-auto" />
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
                      <td className="px-5 py-3 text-sm font-semibold text-green-700">{fmtMoney(Number(p.payment))}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">{p.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                No payouts recorded yet. Payouts are processed by our team once your balance reaches the threshold.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
