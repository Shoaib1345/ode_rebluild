import { Link } from 'react-router-dom'

const TOTAL_STEPS = 10

interface Props {
  /** Overall wizard step: 8 = Plans, 9 = Your Info, 10 = Payment */
  step: 8 | 9 | 10
  children: React.ReactNode
  /** Widen the content column — used by Plans page which shows 4 cards */
  wide?: boolean
}

export default function QuoteLayout({ step, children, wide = false }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 sm:px-10"
        style={{ height: 65, marginTop: 30, marginBottom: 30, flexShrink: 0 }}
      >
        <Link to="/" className="flex-shrink-0">
          <img
            src="/assets/images/logo-img.svg"
            alt="One Day Event"
            style={{ height: 62, width: 'auto' }}
          />
        </Link>

        <a
          href="tel:8886390093"
          style={{
            display: 'inline-block',
            lineHeight: '38px',
            width: 110,
            textAlign: 'center',
            borderRadius: 40,
            border: '1px solid #105778',
            color: '#105778',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          (888) 639-0093
        </a>
      </header>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-10" style={{ marginBottom: 40, flexShrink: 0 }}>
        <div
          style={{
            background: 'rgba(28,160,221,0.1)',
            height: 18,
            borderRadius: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '0 9px',
            gap: 8,
          }}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 40,
                background: '#1087c3',
                opacity: i + 1 <= step ? 1 : 0.1,
                transition: 'opacity 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 pb-16">
        <div className={`mx-auto w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
          {children}
        </div>
      </main>

    </div>
  )
}
