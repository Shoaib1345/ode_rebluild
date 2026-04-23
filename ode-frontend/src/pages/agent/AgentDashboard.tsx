import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { useAuth } from '../../hooks/useAuth'

interface DashboardData {
  leads: {
    total: number
    payment_received: number
    finished: number
    on_hold: number
    by_status: Record<string, number>
  }
  commissions: {
    count: number
    pending: number | null
    paid: number | null
  }
  w9_verified: boolean
}

const STATUS_LABEL: Record<string, string> = {
  tried: 'Started', saved: 'Saved', mq: 'Manual Quote',
  plan_added_manually: 'Plan Added', payment: 'Awaiting Payment',
  payment_received: 'Paid', finished: 'Finished',
}

const STATUS_COLOR: Record<string, string> = {
  tried: 'bg-gray-100 text-gray-600', saved: 'bg-yellow-100 text-yellow-700',
  mq: 'bg-orange-100 text-orange-700', plan_added_manually: 'bg-purple-100 text-purple-700',
  payment: 'bg-blue-100 text-blue-700', payment_received: 'bg-green-100 text-green-700',
  finished: 'bg-green-200 text-green-900',
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

export default function AgentDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['agent-dashboard'],
    queryFn: () => api.get<DashboardData>('/agent/dashboard').then(r => r.data),
    staleTime: 60_000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.first_name}!</h1>
        <p className="text-sm text-gray-500 mt-1">Here's a summary of your assigned leads and commission activity.</p>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse">
              <div className="h-3 w-20 bg-gray-100 rounded mb-3"/><div className="h-7 w-14 bg-gray-100 rounded"/>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Assigned leads" value={data.leads.total} to="/agent/leads" accent/>
          <KPICard label="Paid policies" value={data.leads.payment_received} sub="payment_received"/>
          <KPICard label="On hold" value={data.leads.on_hold} sub={data.leads.on_hold > 0 ? 'Needs attention' : ''}/>
          <KPICard
            label="Pending commission"
            value={fmtMoney(data.commissions.pending)}
            sub={data.w9_verified ? `${data.commissions.count} total` : 'Upload W9 to unlock'}
            to="/agent/commissions"
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
          <Link to="/agent/commissions" className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors">
            Upload W9
          </Link>
        </div>
      )}

      {/* Status breakdown */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Leads by status</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.leads.by_status).map(([status, count]) => (
              <Link key={status} to={`/agent/leads?status=${status}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABEL[status] ?? status}
                <span className="font-bold">{count}</span>
              </Link>
            ))}
            {Object.keys(data.leads.by_status).length === 0 && (
              <p className="text-sm text-gray-400">No leads assigned yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
