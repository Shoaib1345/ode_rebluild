import { Link } from 'react-router-dom'

const STEPS = [
  { label: 'Event Type',  path: '/onedayevent' },
  { label: 'Details',     path: '/quote/details' },
  { label: 'Plans',       path: '/quote/plans' },
  { label: 'Your Info',   path: '/quote/info' },
  { label: 'Payment',     path: '/quote/payment' },
]

interface Props {
  step: 1 | 2 | 3 | 4 | 5
  children: React.ReactNode
}

export default function QuoteLayout({ step, children }: Props) {
  return (
    <div className="min-h-screen bg-[#EBEFF2] flex flex-col">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="bg-[#105778] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white tracking-tight">
            OneDayEvent
          </Link>
          <span className="text-sm text-white/70">
            Step {step} of {STEPS.length}
          </span>
        </div>
      </header>

      {/* ── Progress Bar ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E3E3E3]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            {STEPS.map((s, i) => {
              const num    = i + 1
              const active = num === step
              const done   = num < step
              return (
                <div
                  key={s.label}
                  className={`flex-1 py-3 text-center text-xs font-medium border-b-2 transition-colors ${
                    active
                      ? 'border-[#1CA0DF] text-[#1CA0DF]'
                      : done
                        ? 'border-[#1CA0DF]/40 text-[#1CA0DF]/60'
                        : 'border-transparent text-[#797979]'
                  }`}
                >
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{num}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>

    </div>
  )
}
