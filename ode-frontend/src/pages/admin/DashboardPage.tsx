import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyPoint {
  date: string
  count: number
  revenue: number
}

interface StatsResponse {
  period: string
  leads: {
    today: number
    this_week: number
    this_month: number
    all_time: number
  }
  revenue: {
    this_month: number
    all_time: number
  }
  by_status: Record<string, number>
  bound_count: number
  pending_mq: number
  on_hold: number
  daily_chart: DailyPoint[]
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchStats(): Promise<StatsResponse> {
  const res = await api.get<StatsResponse>('/admin/stats')
  return res.data
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

const STATUS_COLORS: Record<string, string> = {
  tried:               'bg-gray-200',
  saved:               'bg-yellow-200',
  mq:                  'bg-orange-300',
  plan_added_manually: 'bg-purple-200',
  payment:             'bg-[#EDF0FA]',
  payment_received:    'bg-green-400',
  finished:            'bg-green-600',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl border px-5 py-5 ${accent ? 'bg-[#1CA0DF] border-[#1CA0DF] text-white' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${accent ? 'text-white/70' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold ${accent ? 'text-white' : 'text-gray-800'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-20 bg-gray-200 rounded" />
    </div>
  )
}

// ─── 30-day SVG bar chart ─────────────────────────────────────────────────────

function DailyChart({ data }: { data: DailyPoint[] }) {
  const W = 640
  const H = 140
  const PAD_L = 0
  const PAD_B = 28
  const PAD_T = 8
  const barW  = Math.floor((W - PAD_L) / data.length) - 1

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const plotH = H - PAD_T - PAD_B

  // Show label every ~7 bars
  const labelEvery = Math.ceil(data.length / 6)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      role="img"
      aria-label="Daily lead volume chart"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD_T + plotH * (1 - f)
        return (
          <line
            key={f}
            x1={PAD_L}
            x2={W}
            y1={y}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH  = Math.max((d.count / maxCount) * plotH, d.count > 0 ? 2 : 0)
        const x     = PAD_L + i * (barW + 1)
        const y     = PAD_T + plotH - barH
        const showLabel = i % labelEvery === 0 || i === data.length - 1

        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={2}
              className="fill-[#1CA0DF]"
            />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#9ca3af"
              >
                {fmtDate(d.date)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-stats'],
    queryFn:   fetchStats,
    staleTime: 2 * 60 * 1000, // re-fetch after 2 min
  })

  const totalLeadsChart  = data?.daily_chart.reduce((s, d) => s + d.count, 0) ?? 0
  const totalRevenueChart = data?.daily_chart.reduce((s, d) => s + d.revenue, 0) ?? 0

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page heading ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            {data && (
              <p className="text-xs text-gray-400 mt-0.5">
                Period: {data.period}
              </p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-[#1CA0DF] hover:text-[#105778] transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Failed to load stats.{' '}
            <button onClick={() => refetch()} className="underline">Retry</button>
          </div>
        ) : data ? (
          <>
            {/* Row 1 — lead volume */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Leads today"
                value={fmt(data.leads.today)}
              />
              <StatCard
                label="Leads this week"
                value={fmt(data.leads.this_week)}
              />
              <StatCard
                label="Leads this month"
                value={fmt(data.leads.this_month)}
                accent
              />
              <StatCard
                label="All-time leads"
                value={fmt(data.leads.all_time)}
              />
            </div>

            {/* Row 2 — revenue + misc */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Revenue this month"
                value={fmtMoney(data.revenue.this_month)}
                accent
              />
              <StatCard
                label="All-time revenue"
                value={fmtMoney(data.revenue.all_time)}
              />
              <StatCard
                label="Bound policies"
                value={fmt(data.bound_count)}
              />
              <StatCard
                label="Pending manual quotes"
                value={fmt(data.pending_mq)}
                sub={data.on_hold > 0 ? `${data.on_hold} on hold` : undefined}
              />
            </div>

            {/* ── 30-day chart ────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">
                  Last 30 days — leads
                </h2>
                <span className="text-xs text-gray-400">
                  {fmt(totalLeadsChart)} leads · {fmtMoney(totalRevenueChart)} revenue
                </span>
              </div>
              <DailyChart data={data.daily_chart} />
            </div>

            {/* ── Status breakdown ────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                All-time leads by status
              </h2>
              <div className="space-y-3">
                {Object.entries(STATUS_LABELS).map(([key, label]) => {
                  const count = data.by_status[key] ?? 0
                  const total = data.leads.all_time || 1
                  const pct   = Math.round((count / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="text-gray-500 font-medium">{fmt(count)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[key] ?? 'bg-gray-300'} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}

      </div>
    </AdminLayout>
  )
}
