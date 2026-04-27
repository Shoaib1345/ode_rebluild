import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'

interface DashboardData {
  referral_string: string
  commission_per_referral: number
  referrals: {
    total: number
    paid: number
    this_month: number
    paid_month: number
  }
  commissions: {
    count: number
    pending: number | null
    paid: number | null
  }
  w9_verified: boolean
}

function fmtMoney(n: number | null) {
  if (n === null) return '—'
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function KPICard({ label, value, sub, accent = false, to }: {
  label: string; value: string | number; sub?: string; accent?: boolean; to?: string
}) {
  const cls = `rounded-xl border px-5 py-5 ${accent ? 'bg-[#1CA0DF] border-[#1CA0DF]' : 'bg-white border-gray-200'} ${to ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`
  const inner = (
    <>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>}
    </>
  )
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>
}

export default function PlannerDashboard() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['planner-dashboard'],
    queryFn: () => api.get<DashboardData>('/planner/dashboard').then(r => r.data),
    staleTime: 60_000,
  })

  const referralUrl = data?.referral_string
    ? `${window.location.origin}/onedayevent?ref=${data.referral_string}`
    : ''

  const handleCopy = () => {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's a summary of your referral activity. You earn ${data?.commission_per_referral ?? 15} per completed policy.
        </p>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse">
              <div className="h-3 w-20 bg-gray-100 rounded mb-3"/><div className="h-7 w-14 bg-gray-100 rounded"/>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Referrals"
            value={data.referrals.total}
            sub={`${data.referrals.this_month} this month`}
            to="/planner/referrals"
            accent
          />
          <KPICard
            label="Paid Policies"
            value={data.referrals.paid}
            sub={`${data.referrals.paid_month} this month`}
          />
          <KPICard
            label="Pending Commission"
            value={fmtMoney(data.commissions.pending)}
            sub={data.w9_verified ? `${data.commissions.count} total` : 'Upload W9 to unlock'}
            to="/planner/commissions"
          />
          <KPICard
            label="Commission Paid"
            value={fmtMoney(data.commissions.paid)}
            sub={data.w9_verified ? 'Lifetime' : '—'}
            to="/planner/commissions"
          />
        </div>
      ) : null}

      {/* W9 notice */}
      {data && !data.w9_verified && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800">Upload your W9 to unlock commission amounts</p>
            <p className="text-xs text-amber-700 mt-0.5">Commission rows are tracked but amounts are hidden until our team verifies your W9.</p>
          </div>
          <Link to="/planner/commissions" className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors">
            Upload W9
          </Link>
        </div>
      )}

      {/* Referral link */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Your Referral Link</h2>
          <p className="text-xs text-gray-500 mb-3">
            Share this link with your clients. You'll earn ${data.commission_per_referral} for every policy they purchase.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#1CA0DF] hover:bg-[#1786BB] text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {data.referral_string && (
            <p className="text-xs text-gray-400 mt-2">
              Code: <span className="font-mono font-medium text-gray-600">{data.referral_string}</span>
            </p>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/planner/referrals" className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#1CA0DF]">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">View Referrals</p>
            <p className="text-xs text-gray-400">Track your referred leads</p>
          </div>
        </Link>
        <Link to="/planner/commissions" className="bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-md transition-shadow flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd"/></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Commissions & W9</p>
            <p className="text-xs text-gray-400">Earnings and payout status</p>
          </div>
        </Link>
      </div>

    </div>
  )
}
