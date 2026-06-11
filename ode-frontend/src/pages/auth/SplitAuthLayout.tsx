import { Link } from 'react-router-dom'

export interface AuthFeature {
  icon: string
  title: string
  desc?: string
}

interface Props {
  /** Left-panel heading (the action, e.g. "Create your partner account"). */
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Links rendered under the form (e.g. "Already have an account?"). */
  footer?: React.ReactNode
  /** Right marketing panel. */
  panelTitle: string
  panelSubtitle?: string
  features: AuthFeature[]
}

/**
 * Two-column auth shell matching the OneDayEvent login page:
 *   - LEFT  : white panel with the logo + form (rounded right edge on desktop).
 *   - RIGHT : light-gray marketing panel with a Contact button and feature cards.
 *
 * The marketing panel is hidden on small screens so long forms stay readable.
 */
export default function SplitAuthLayout({
  title, subtitle, children, footer, panelTitle, panelSubtitle, features,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT — form ───────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 bg-white px-6 py-8 sm:px-10 lg:pl-20 lg:pr-12 lg:py-12 flex flex-col lg:rounded-r-[40px] relative z-10">
        <Link to="/" className="flex items-center gap-3 self-start">
          <img src="/assets/images/logo-img.svg" alt="" className="h-11 w-11" />
          <img src="/assets/images/logo-text.svg" alt="One Day Event" className="h-7" />
        </Link>

        <div className="w-full max-w-md mt-8 lg:mt-10 mx-auto lg:mx-0 flex-1">
          <h2 className="text-2xl lg:text-[26px] font-bold text-[#262D45] tracking-tight">{title}</h2>
          <p className="text-sm text-[#808080] mt-1 mb-8">{subtitle ?? ' '}</p>
          {children}
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </div>

      {/* ── RIGHT — marketing ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-full lg:w-1/2 bg-[#F8F8F8] text-[#262D45] px-6 py-10 sm:px-10 lg:px-12 lg:py-12 relative flex-col">
        <div className="flex justify-end">
          <Link
            to="/contact"
            className="bg-[#1CA0DF] hover:bg-[#1786BB] text-white font-semibold rounded-full px-10 h-[52px] flex items-center transition"
          >
            Contact
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center mt-8 lg:mt-12">
          <div className="w-full max-w-sm text-center">
            <h2 className="text-2xl lg:text-[30px] font-bold leading-tight mb-2">{panelTitle}</h2>
            {panelSubtitle && <p className="text-sm text-[#808080] mb-8">{panelSubtitle}</p>}

            <div className="space-y-8 mt-8">
              {features.map((f) => (
                <div key={f.title}>
                  <div className="bg-white rounded-2xl w-[100px] h-[100px] mx-auto flex items-center justify-center mb-3 shadow-sm">
                    <img src={f.icon} alt="" className="max-h-[52px] max-w-[52px]" />
                  </div>
                  <h3 className="text-lg font-bold leading-snug px-4">{f.title}</h3>
                  {f.desc && <p className="text-[13px] text-[#808080] mt-1 px-6 leading-relaxed">{f.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
