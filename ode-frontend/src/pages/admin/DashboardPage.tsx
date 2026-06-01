import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/axios'
import AdminLayout from './AdminLayout'
import toast from 'react-hot-toast'

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
    today?:      number
    this_week?:  number
    this_month:  number
    all_time:    number
  }
  by_status: Record<string, number>
  bound_count: number
  pending_mq:  number
  on_hold:     number
  daily_chart: DailyPoint[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US')
}

function fmtNum(n: number) {
  return n.toLocaleString('en-US')
}

function fmtPct(n: number) {
  return n.toFixed(2) + '%'
}

// ─── Top Stat Card ────────────────────────────────────────────────────────────
//  Matches production: colored circle icon on left + large number + label

interface TopCardProps {
  label:  string
  value:  string
  circleColor: string
  icon:   React.ReactNode
}

function ReportTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-5 flex items-center justify-between">
      <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

function TopStatCard({ label, value, circleColor, icon }: TopCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-5 flex items-center gap-4">
      {/* Colored circle */}
      <div
        className="flex-shrink-0 w-[64px] h-[64px] rounded-full flex items-center justify-center text-white"
        style={{ background: circleColor }}
      >
        {icon}
      </div>
      {/* Text */}
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
// 270-degree arc (gap at bottom), matching production

function CircularGauge({ value, max }: { value: number; max: number }) {
  const r    = 54
  const cx   = 70
  const cy   = 70
  const size = 140
  const circ = 2 * Math.PI * r           // full circumference ≈ 339.3
  const arc  = (270 / 360) * circ        // 270° arc ≈ 254.5
  const gap  = circ - arc                // remaining 90° ≈ 84.8
  const pct  = max > 0 ? Math.min(value / max, 1) : 0
  const fill = arc * pct

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track (270° arc, gap at bottom) */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={10}
        strokeDasharray={`${arc} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Filled progress arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#1CA0DF"
        strokeWidth={10}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(135 ${cx} ${cy})`}
      />
      {/* Center number */}
      <text
        x={cx} y={cy + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="32"
        fontWeight="700"
        fill="#1CA0DF"
      >
        {value}
      </text>
    </svg>
  )
}

// ─── Monthly Revenue Bar Chart ────────────────────────────────────────────────

interface MonthData {
  label:   string
  revenue: number
  count:   number
}

function MonthlyRevenueChart({ data }: { data: MonthData[] }) {
  const W       = 560
  const H       = 220
  const PAD_L   = 56
  const PAD_B   = 28
  const PAD_T   = 10
  const PAD_R   = 10
  const plotW   = W - PAD_L - PAD_R
  const plotH   = H - PAD_T - PAD_B
  const maxRev  = Math.max(...data.map(d => d.revenue), 1)
  const barW    = Math.max(Math.floor(plotW / data.length) - 4, 6)

  // Y-axis guide values
  const guides = [0, 0.25, 0.5, 0.75, 1]

  function fmtY(v: number) {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M'
    if (v >= 1_000)     return '$' + (v / 1_000).toFixed(0) + 'K'
    return '$' + v
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: H }}
      role="img"
      aria-label="Monthly revenue chart"
    >
      {/* Grid lines + Y labels */}
      {guides.map((f) => {
        const y   = PAD_T + plotH * (1 - f)
        const val = maxRev * f
        return (
          <g key={f}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">
              {fmtY(val)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH  = Math.max((d.revenue / maxRev) * plotH, d.revenue > 0 ? 2 : 0)
        const xStep = plotW / data.length
        const x     = PAD_L + i * xStep + (xStep - barW) / 2
        const y     = PAD_T + plotH - barH

        return (
          <g key={d.label}>
            <rect
              x={x} y={y}
              width={barW}
              height={barH}
              rx={3}
              fill="#1CA0DF"
              fillOpacity={0.85}
            />
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize={8}
              fill="#9CA3AF"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Gauge period tab ─────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month'

// ─── Custom report types ──────────────────────────────────────────────────────

type ReportPeriod = 'today' | 'week' | 'month' | 'dates'

interface CustomReport {
  total_leads:           number
  total_payment_leads:   number
  total_mq_leads:        number
  total_saved_leads:     number
  total_tried_leads:     number
  total_canceled_leads:  number
  payment_broker_fee:    number
  total_business_loss:   number
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [gaugePeriod, setGaugePeriod] = useState<Period>('today')

  // ── Custom Dashboard Figures (popup-style report) ────────────────────────
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [startDate,       setStartDate]       = useState('')
  const [endDate,         setEndDate]         = useState('')
  const [customReport,    setCustomReport]    = useState<CustomReport | null>(null)

  const reportMutation = useMutation({
    mutationFn: async (params: { period: ReportPeriod; start?: string; end?: string }) => {
      const res = await api.get<CustomReport>('/admin/stats/custom-report', { params })
      return res.data
    },
    onSuccess: (data) => setCustomReport(data),
    onError:   () => toast.error('Could not generate report.'),
  })

  const runReport = (period: ReportPeriod) => {
    if (period === 'dates') {
      if (!startDate || !endDate) {
        toast.error('Pick a start and end date first.')
        return
      }
      reportMutation.mutate({ period, start: startDate, end: endDate })
    } else {
      reportMutation.mutate({ period })
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey:  ['admin-stats'],
    queryFn:   async () => {
      const res = await api.get<StatsResponse>('/admin/stats')
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })

  // ── Derived values ────────────────────────────────────────────────────────

  // Conversion rate = bound policies / all-time leads
  const conversion = data
    ? data.leads.all_time > 0
      ? (data.bound_count / data.leads.all_time) * 100
      : 0
    : 0

  // Total clients = payment_received + finished statuses
  const totalClients = data
    ? (data.by_status['payment_received'] ?? 0) + (data.by_status['finished'] ?? 0)
    : 0

  // Today's revenue from daily_chart (find today's entry)
  const todayRevenue = useMemo(() => {
    if (!data?.daily_chart?.length) return 0
    const todayStr = new Date().toISOString().slice(0, 10)
    const entry    = data.daily_chart.find(d => d.date === todayStr)
    return entry?.revenue ?? 0
  }, [data])

  // Gauge: what count/revenue to show based on selected period
  const gaugeCount = data
    ? gaugePeriod === 'today'
      ? data.leads.today
      : gaugePeriod === 'week'
        ? data.leads.this_week
        : data.leads.this_month
    : 0

  const gaugeRevenue = data
    ? gaugePeriod === 'today'
      ? todayRevenue
      : gaugePeriod === 'week'
        ? (data.revenue.this_week  ?? 0)
        : data.revenue.this_month
    : 0

  // Gauge max = weekly or monthly target (rough: 3× the current value, min 10)
  const gaugeMax = Math.max(gaugeCount * 3, 10)

  // Gauge label
  const gaugeLabel =
    gaugePeriod === 'today' ? 'Total sales made today'
    : gaugePeriod === 'week' ? 'Total sales this week'
    : 'Total sales this month'

  // Monthly chart — group daily_chart by month
  const monthlyData: MonthData[] = useMemo(() => {
    if (!data?.daily_chart?.length) return []
    const map = new Map<string, MonthData>()
    for (const d of data.daily_chart) {
      const [year, month] = d.date.split('-')
      const key = `${year}-${month}`
      const label = new Date(`${year}-${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const existing = map.get(key) ?? { label, revenue: 0, count: 0 }
      existing.revenue += d.revenue
      existing.count   += d.count
      map.set(key, existing)
    }
    return Array.from(map.values())
  }, [data])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Page title row ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="text-xs text-gray-400 hover:text-[#1CA0DF] transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setShowReportPanel((v) => {
                  // closing the panel also wipes any report so default cards reappear
                  if (v) setCustomReport(null)
                  return !v
                })
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: '#22C55E' }}
            >
              Custom Dashboard Figure
            </button>
          </div>
        </div>

        {/* ── Date-range / preset panel ─────────────────────────────────── */}
        {showReportPanel && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1CA0DF]"
            />
            <button
              disabled={reportMutation.isPending}
              onClick={() => runReport('dates')}
              className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-[#5B6CFF] hover:bg-[#4453E0] disabled:opacity-60 transition-colors"
            >
              {reportMutation.isPending ? 'Loading…' : 'Generate Report'}
            </button>
            <button
              disabled={reportMutation.isPending}
              onClick={() => runReport('today')}
              className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-[#34D3EB] hover:bg-[#1FB8D0] disabled:opacity-60 transition-colors"
            >
              Today
            </button>
            <button
              disabled={reportMutation.isPending}
              onClick={() => runReport('week')}
              className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-[#1CA0DF] hover:bg-[#1786BB] disabled:opacity-60 transition-colors"
            >
              This Week
            </button>
            <button
              disabled={reportMutation.isPending}
              onClick={() => runReport('month')}
              className="h-10 px-5 rounded-lg text-xs font-semibold text-white bg-[#1CA0DF] hover:bg-[#1786BB] disabled:opacity-60 transition-colors"
            >
              This Month
            </button>
          </div>
        )}

        {/* ── Custom report cards (replaces default top cards while present) ── */}
        {customReport && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportTile label="Total Leads"     value={fmtNum(customReport.total_leads)} />
            <ReportTile label="Payment"         value={fmtNum(customReport.total_payment_leads)} />
            <ReportTile label="Manual"          value={fmtNum(customReport.total_mq_leads)} />
            <ReportTile label="Saved"           value={fmtNum(customReport.total_saved_leads)} />
            <ReportTile label="Broker Fee"      value={fmtMoney(customReport.payment_broker_fee)} />
            <ReportTile label="Cancel"          value={fmtNum(customReport.total_canceled_leads)} />
            <ReportTile label="Tried"           value={fmtNum(customReport.total_tried_leads)} />
            <ReportTile label="Business Loss"   value={fmtMoney(customReport.total_business_loss)} />
          </div>
        )}

        {/* ── 4 top stat cards ──────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 animate-pulse flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="space-y-2">
                  <div className="h-6 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            Could not load stats.{' '}
            <button onClick={() => refetch()} className="underline font-semibold">Retry</button>
          </div>
        ) : data ? (
          <>
          {!customReport && (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {/* 1. Total Revenue */}
              <TopStatCard
                label="Total Revenue"
                value={fmtMoney(data.revenue.all_time)}
                circleColor="linear-gradient(135deg, #26D0CE, #1CA0DF)"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              {/* 2. Total Leads */}
              <TopStatCard
                label="Total Leads"
                value={fmtNum(data.leads.all_time)}
                circleColor="linear-gradient(135deg, #F472B6, #EC4899)"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
              />

              {/* 3. Conversion */}
              <TopStatCard
                label="Conversion"
                value={fmtPct(conversion)}
                circleColor="linear-gradient(135deg, #A78BFA, #7C3AED)"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />

              {/* 4. Total Clients */}
              <TopStatCard
                label="Total Clients"
                value={fmtNum(totalClients)}
                circleColor="linear-gradient(135deg, #6EE7B7, #10B981)"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
            </div>
          )}

            {/* ── Two-column lower section ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left — TOTAL REVENUE (circular gauge) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                  Total Revenue
                </h2>

                {/* Gauge */}
                <div className="flex flex-col items-center">
                  <CircularGauge value={gaugeCount} max={gaugeMax} />
                  <p className="text-sm text-gray-400 mt-2 text-center">{gaugeLabel}</p>
                  <p className="text-3xl font-bold text-gray-700 mt-1">
                    {fmtMoney(gaugeRevenue)}
                  </p>
                </div>

                {/* Period tabs */}
                <div className="flex border-t border-gray-100 mt-5 pt-3 gap-1">
                  {([
                    { key: 'today', label: 'This week' },
                    { key: 'week',  label: 'Last week' },
                    { key: 'month', label: 'Last Month' },
                  ] as { key: Period; label: string }[]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setGaugePeriod(tab.key)}
                      className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                        gaugePeriod === tab.key
                          ? 'bg-[#1CA0DF] text-white'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right — TOTAL REVENUE BY MONTH */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Total Revenue by Month
                  </h2>
                  <span className="text-[10px] text-gray-400">
                    Last {monthlyData.length} month{monthlyData.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {monthlyData.length > 0 ? (
                  <MonthlyRevenueChart data={monthlyData} />
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-gray-300">
                    No data yet
                  </div>
                )}
              </div>
            </div>

            {/* ── Quick stats row ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Leads today',          value: fmtNum(data.leads.today)       },
                { label: 'Leads this week',       value: fmtNum(data.leads.this_week)   },
                { label: 'Bound policies',        value: fmtNum(data.bound_count)       },
                { label: 'Pending manual quotes', value: fmtNum(data.pending_mq)        },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-4">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-xl font-bold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}

      </div>
    </AdminLayout>
  )
}
