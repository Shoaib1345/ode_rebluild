import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  policies_count: number
  open_invoices_count: number
  commissions_count: number
  pending_commission: number | null
  w9_verified: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, to, accent = false, warn = false,
}: {
  label: string
  value: string | number
  sub?: string
  to?: string
  accent?: boolean
  warn?: boolean
}) {
  const base = `rounded-xl border px-5 py-5 transition-shadow ${
    to ? 'hover:shadow-md cursor-pointer' : ''
  } ${
    accent ? 'bg-[#1CA0DF] border-[#1CA0DF]' :
    warn   ? 'bg-amber-50 border-amber-200' :
    'bg-white border-gray-200'
  }`

  const inner = (
    <>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${
        accent ? 'text-white/70' : warn ? 'text-amber-600' : 'text-gray-500'
      }`}>
        {label}
      </p>
      <p className={`text-2xl font-bold ${
        accent ? 'text-white' : warn ? 'text-amber-800' : 'text-gray-800'
      }`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>
      )}
    </>
  )

  return to
    ? <Link to={to} className={base}>{inner}</Link>
    : <div className={base}>{inner}</div>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey:  ['customer-dashboard'],
    queryFn:   () => api.get<DashboardData>('/customer/dashboard').then((r) => r.data),
    staleTime: 60 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* ── Welcome ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's a summary of your event insurance policies and account activity.
        </p>
      </div>

      {/* ── Summary cards ────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-100 rounded mb-3"/>
              <div className="h-7 w-16 bg-gray-100 rounded"/>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="My policies"
            value={data.policies_count}
            sub="Completed event policies"
            to="/customer/events"
            accent
          />
          <StatCard
            label="Open invoices"
            value={data.open_invoices_count}
            to="/customer/invoices"
            warn={data.open_invoices_count > 0}
            sub={data.open_invoices_count > 0 ? 'Action required' : 'All paid — great!'}
          />
          <StatCard
            label="Pending commission"
            value={fmtMoney(data.pending_commission)}
            sub={data.w9_verified
              ? `${data.commissions_count} commission${data.commissions_count !== 1 ? 's' : ''} total`
              : 'Upload W9 to see amounts'}
            to="/customer/commissions"
          />
        </div>
      ) : null}

      {/* ── W9 prompt (if not verified) ───────────────────────── */}
      {data && !data.w9_verified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">W9 required for commission payouts</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upload your W9 tax form to unlock your commission amounts. Amounts are hidden until our team verifies your form.
            </p>
          </div>
          <Link
            to="/customer/commissions"
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Upload W9
          </Link>
        </div>
      )}

      {/* ── Quick links ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Quick links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/customer/events"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#EDF0FA] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1CA0DF]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">View my policies</p>
              <p className="text-xs text-gray-400">Download certificates of insurance</p>
            </div>
          </Link>

          <Link
            to="/customer/refer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Refer a friend — earn $5</p>
              <p className="text-xs text-gray-400">Share your link and earn per completed policy</p>
            </div>
          </Link>

          <Link
            to="/onedayevent"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Get a new quote</p>
              <p className="text-xs text-gray-400">Insure another upcoming event</p>
            </div>
          </Link>

          <Link
            to="/customer/invoices"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Pay an invoice</p>
              <p className="text-xs text-gray-400">View and pay outstanding invoices</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
