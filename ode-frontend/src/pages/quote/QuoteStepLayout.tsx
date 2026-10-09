import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** Overall wizard step number 1–10 */
  step: number
  /** Page title — omit or pass empty string to suppress the centred h2 */
  title?: string
  subtitle?: string
  /** Illustration image URL shown below the title */
  image?: string
  /** Use 150px image height instead of 125px */
  imageLarge?: boolean
  /** Narrow inner width — 640px default, 480px when true (event-type step) */
  innerNarrow?: boolean
  /**
   * Widen the content column to 1000px — used by the Payment page which
   * renders a 2-column form + summary layout.
   */
  wide?: boolean
  /** Previous URL — triggers back arrow + Save Quote in header */
  backTo?: string
  /**
   * When provided, replaces the 10-pill wizard bar with a 3-segment
   * checkout progress bar (1 = Insured Info, 2 = Venue Details, 3 = Contact & Pay).
   */
  checkoutStep?: number
  children: React.ReactNode
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const CHECKOUT_LABELS = ['Insured Info', 'Venue Details', 'Contact & Pay'] as const

export default function QuoteStepLayout({
  step,
  title,
  subtitle,
  image,
  imageLarge,
  innerNarrow,
  wide,
  backTo,
  checkoutStep,
  children,
}: Props) {
  const navigate = useNavigate()

  // ── Save Quote (placeholder — sends email in production) ──────────────────
  const handleSave = () => {
    toast('Complete your info on step 9 to receive a saved-quote link!', { icon: '📧' })
  }

  // Outer 1030px container matches legacy `.quote-pg header .container` + `.quote-pg .quote`
  const OUTER_MAX = 1030

  return (
    <div className="min-h-screen bg-white" style={{ position: 'relative' }}>

      {/* ── Content zone (sits above footer wave) ────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-5 sm:px-8"
          style={{
            height: 65,
            margin: '30px auto',
            maxWidth: OUTER_MAX,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left group: back arrow + logo */}
          <div className="flex items-center" style={{ gap: 12 }}>
            {backTo && (
              <button
                type="button"
                onClick={() => navigate(backTo)}
                aria-label="Go back"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '1px solid #E3E3E3',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" fill="none" stroke="#555" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/assets/images/logo-img.svg"
                alt="One Day Event"
                style={{ height: 62, width: 'auto' }}
              />
            </Link>
          </div>

          {/* Right group: Save Quote (step 2+) + Phone */}
          <div className="flex items-center" style={{ gap: 10 }}>
            {backTo && (
              <button
                type="button"
                onClick={handleSave}
                style={{
                  display: 'inline-block',
                  lineHeight: '36px',
                  padding: '0 18px',
                  borderRadius: 40,
                  border: 'none',
                  background: '#1CA0DF',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Save Quote
              </button>
            )}
            <a
              href="tel:8886390093"
              style={{
                display: 'inline-block',
                lineHeight: '36px',
                padding: '0 14px',
                borderRadius: 40,
                border: '1px solid #CCCCCC',
                color: '#555',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Phone
            </a>
          </div>
        </header>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div
          className="px-5 sm:px-8"
          style={{
            margin: '0 auto 50px',
            maxWidth: OUTER_MAX,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {checkoutStep != null ? (
            /* ── Checkout 3-step progress bar ──────────────────────────────── */
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {CHECKOUT_LABELS.map((label, i) => (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 40,
                      background: '#1087c3',
                      opacity: i + 1 <= checkoutStep ? 1 : 0.15,
                      transition: 'opacity 0.3s ease',
                      marginBottom: 6,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: i + 1 <= checkoutStep ? '#105778' : '#9CA3AF',
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* ── Wizard 10-pill progress bar ────────────────────────────────── */
            <div
              style={{
                background: 'rgba(28,160,221,0.1)',
                height: 18,
                borderRadius: 40,
                display: 'flex',
                alignItems: 'center',
                padding: '0 5px',
                gap: 10,
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
          )}
        </div>

        {/* ── Outer content (1030px) — holds wide title/subtitle ────────────── */}
        <div
          className="px-5 sm:px-8"
          style={{
            maxWidth: OUTER_MAX,
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. Title — wide canvas so it doesn't wrap awkwardly */}
          {title && (
            <h2
              style={{
                fontSize: 32,
                lineHeight: '39px',
                fontWeight: 900,
                marginBottom: subtitle ? 12 : 30,
                textAlign: 'center',
                color: '#262D45',
              }}
            >
              {title}
            </h2>
          )}

          {/* 2. Subtitle — also wide */}
          {subtitle && (
            <p
              style={{
                textAlign: 'center',
                color: '#797979',
                fontSize: 14,
                marginBottom: 24,
                lineHeight: '22px',
              }}
            >
              {subtitle}
            </p>
          )}

          {/* ── Inner (568px / 426 narrow / 1000 wide) — image + form ───────── */}
          <div
            style={{
              maxWidth: wide ? 1000 : (innerNarrow ? 426 : 568),
              width: '100%',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {/* 3. Illustration image */}
            {image && (
              <div
                style={{
                  height: imageLarge ? 150 : 125,
                  backgroundImage: `url(${image})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  marginBottom: 30,
                }}
              />
            )}

            {/* 4. Page-specific content */}
            {children}

            {/* Breathing room before footer wave shows */}
            <div style={{ height: 60 }} />
          </div>
        </div>
      </div>

      {/* â”€â”€ Footer wave â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        style={{
          position: 'relative',
          zIndex: 0,
          marginTop: -260,
          height: 418,
          backgroundImage: 'url(/assets/images/quote-footer-bg.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ─── Shared button primitives ─────────────────────────────────────────────────

/**
 * Option button — ode_new `.btn-primary` style
 * Inactive: white bg, #105778 1px border, #262D45 text
 * Active:   #E0232C bg + border, white text
 */
export function QuoteOptionBtn({
  active,
  onClick,
  children,
  fullWidth,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: fullWidth ? '100%' : undefined,
        lineHeight: '54px',
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        borderRadius: 10,
        border: active ? '1px solid #E0232C' : '1px solid #105778',
        backgroundColor: active ? '#E0232C' : '#fff',
        color: active ? '#fff' : '#262D45',
        cursor: 'pointer',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
        padding: '0 10px',
      }}
    >
      {children}
    </button>
  )
}

/**
 * "Next" pill button — ode_new `.btn-maroon` style
 * width 158px, height 60px, border-radius 60px, centered with margin-top 50px
 */
export function QuoteNextBtn({
  onClick,
  disabled,
  children = 'Next',
  fullWidth,
}: {
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled}
      className="quote-next-btn"
      style={{
        display: 'block',
        width: fullWidth ? '100%' : 158,
        minWidth: fullWidth ? undefined : 158,
        lineHeight: '60px',
        height: 60,
        borderRadius: 60,
        margin: '60px auto 0',
        backgroundColor: disabled ? '#D5D9E6' : '#E0232C',
        color: '#fff',
        fontSize: 17,
        fontWeight: 700,
        textAlign: 'center',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}
