import { Link } from 'react-router-dom'

const TOTAL_STEPS = 10
// Centered container width — matches the main site's quote `.container`
// (and QuoteStepLayout's OUTER_MAX) so the header / progress / content all align.
const OUTER_MAX = 1030

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

      {/* ── Header (inside container) ───────────────────────────────────── */}
      <header style={{ height: 65, marginTop: 30, marginBottom: 30, flexShrink: 0 }}>
        <div
          className="flex items-center justify-between px-5 sm:px-8 mx-auto w-full"
          style={{ maxWidth: OUTER_MAX, boxSizing: 'border-box' }}
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
        </div>
      </header>

      {/* ── Progress bar (inside container) ─────────────────────────────── */}
      <div
        className="px-5 sm:px-8 mx-auto w-full"
        style={{ maxWidth: OUTER_MAX, marginBottom: 40, flexShrink: 0, boxSizing: 'border-box' }}
      >
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

      {/* ── Content (inside container) ──────────────────────────────────── */}
      <main className="flex-1 px-5 sm:px-8 pb-16">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: wide ? OUTER_MAX : 672, boxSizing: 'border-box' }}
        >
          {children}
        </div>
      </main>

    </div>
  )
}
