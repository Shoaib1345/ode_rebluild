import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'

// Logo spins exactly once on page load — matches ode_new CSS animation
let _logoHasSpun = false

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavPage {
  id: number
  title: string
  navbar_text: string | null
  slug: string
}

interface EventTypeNav {
  id: number
  event_type: string
}

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useNavPages() {
  return useQuery<NavPage[]>({
    queryKey: ['public-nav'],
    queryFn: () => api.get('/pages/nav').then(r => r.data),
    staleTime: 10 * 60 * 1000,
    placeholderData: [],
  })
}

function useEventTypes() {
  return useQuery<EventTypeNav[]>({
    queryKey: ['event-types-nav'],
    queryFn: () => api.get('/event-types').then(r => r.data),
    staleTime: 15 * 60 * 1000,
    placeholderData: [],
  })
}

// ─── Dropdown component ───────────────────────────────────────────────────────

function NavDropdown({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLLIElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <li ref={ref} className="nav-dropdown">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1 text-[13.5px] font-semibold text-[#262D45] hover:text-[#1CA0DF] transition-colors py-2 px-1 select-none"
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="nav-dropdown-menu" onMouseLeave={() => setOpen(false)}>
          {children}
        </div>
      )}
    </li>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [logoSpun, setLogoSpun] = useState(_logoHasSpun)
  const location = useLocation()
  const { data: navPages = [] } = useNavPages()
  const { data: eventTypes = [] } = useEventTypes()

  // Transparent header only on homepage when not scrolled
  const isHome       = location.pathname === '/'
  const isTransparent = isHome && !scrolled && !mobileOpen

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMobileSection(null) }, [location.pathname])

  // Add shadow when scrolled
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Top 12 event types for the Events dropdown
  const topEvents = eventTypes.slice(0, 12)

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isTransparent
          ? 'bg-transparent shadow-none'
          : scrolled
            ? 'bg-white shadow-[0_2px_12px_rgba(0,0,0,0.10)]'
            : 'bg-white shadow-[0_1px_0_#E3E3E3]'
      }`}
    >
      <div className="max-w-[1250px] mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between h-[72px]">

          {/* ── Logo ────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <img
              src="/assets/images/logo-img.svg"
              alt=""
              className={`h-[56px] w-auto ${logoSpun ? '' : 'logo-spin-once'}`}
              onAnimationEnd={() => { _logoHasSpun = true; setLogoSpun(true) }}
            />
            <img
              src="/assets/images/logo-text2.svg"
              alt="One Day Event Insurance"
              className="h-[42px] w-auto hidden sm:block mt-1"
            />
          </Link>

          {/* ── Desktop nav ─────────────────────────────────────────────── */}
          <ul className="hidden lg:flex items-center gap-1 list-none m-0 p-0 absolute left-1/2 -translate-x-1/2">

            {/* Events */}
            <NavDropdown label="Events">
              {topEvents.length > 0 ? (
                <>
                  {topEvents.map(et => (
                    <Link key={et.id} to="/onedayevent">{et.event_type}</Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link to="/onedayevent">View All Events →</Link>
                  </div>
                </>
              ) : (
                <Link to="/onedayevent">Get a Quote</Link>
              )}
            </NavDropdown>

            {/* Learn */}
            <NavDropdown label="Learn">
              <Link to="/about">About Us</Link>
              <Link to="/faq">FAQ's</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/privacy">Privacy</Link>
              {navPages.map(p => (
                <Link key={p.id} to={`/pages/${p.slug}`}>{p.navbar_text ?? p.title}</Link>
              ))}
            </NavDropdown>

            {/* Partners */}
            <NavDropdown label="Partners">
              <Link to="/partner-signup?type=agent">Insurance Agents</Link>
              <Link to="/partner-signup?type=planner">Event Planners</Link>
              <Link to="/partner-signup?type=venue">Venue Partners</Link>
              <Link to="/affiliate-signup">Other</Link>
            </NavDropdown>

          </ul>

          {/* ── Desktop buttons ──────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              to="/login"
              className="text-[13.5px] font-semibold text-[#105778] border border-[#105778] rounded-full px-5 py-1.5 hover:bg-[#cfefff] transition-colors"
            >
              Login
            </Link>
            <Link
              to="/contact"
              className="text-[13.5px] font-semibold text-white bg-[#1CA0DF] rounded-full px-5 py-1.5 hover:bg-[#1786BB] transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* ── Mobile hamburger ────────────────────────────────────────── */}
          <button
            className="lg:hidden p-2 rounded-lg text-[#262D45] hover:bg-gray-100 transition"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
      </div>

      {/* ── Mobile menu ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#E3E3E3] shadow-lg">
          <div className="max-w-[1100px] mx-auto px-4 py-3 space-y-0.5">

            {/* Events accordion */}
            <MobileAccordion
              label="Events"
              open={mobileSection === 'events'}
              onToggle={() => setMobileSection(s => s === 'events' ? null : 'events')}
            >
              {topEvents.map(et => (
                <Link key={et.id} to="/onedayevent" className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">
                  {et.event_type}
                </Link>
              ))}
              <Link to="/onedayevent" className="block py-2 pl-4 text-sm font-semibold text-[#1CA0DF]">
                View All Events →
              </Link>
            </MobileAccordion>

            {/* Learn accordion */}
            <MobileAccordion
              label="Learn"
              open={mobileSection === 'learn'}
              onToggle={() => setMobileSection(s => s === 'learn' ? null : 'learn')}
            >
              <Link to="/about"   className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">About Us</Link>
              <Link to="/faq"     className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">FAQ's</Link>
              <Link to="/blog"    className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Blog</Link>
              <Link to="/privacy" className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Privacy</Link>
            </MobileAccordion>

            {/* Partners accordion */}
            <MobileAccordion
              label="Partners"
              open={mobileSection === 'partners'}
              onToggle={() => setMobileSection(s => s === 'partners' ? null : 'partners')}
            >
              <Link to="/partner-signup?type=agent"    className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Insurance Agents</Link>
              <Link to="/partner-signup?type=planner"  className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Event Planners</Link>
              <Link to="/partner-signup?type=venue"    className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Venue Partners</Link>
              <Link to="/affiliate-signup"             className="block py-2 pl-4 text-sm text-[#505458] hover:text-[#1CA0DF]">Other</Link>
            </MobileAccordion>

            {/* Bottom CTA row */}
            <div className="flex gap-2 pt-3 pb-2 border-t border-[#E3E3E3] mt-2">
              <Link
                to="/login"
                className="flex-1 text-center text-sm font-semibold text-[#105778] border border-[#105778] rounded-full py-2 hover:bg-[#cfefff] transition"
              >
                Login
              </Link>
              <Link
                to="/contact"
                className="flex-1 text-center text-sm font-semibold text-white bg-[#1CA0DF] rounded-full py-2 hover:bg-[#1786BB] transition"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

// ─── Mobile accordion helper ──────────────────────────────────────────────────

function MobileAccordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-[#262D45] hover:text-[#1CA0DF] transition-colors"
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const SOCIAL = [
  {
    href: 'https://www.instagram.com/onedayeventinsurance/',
    src: '/assets/images/icon-instagram.svg',
    alt: 'Instagram',
  },
  {
    href: 'https://www.facebook.com/onedayeventinsurance',
    src: '/assets/images/icon-facebook.svg',
    alt: 'Facebook',
  },
  {
    href: 'https://twitter.com/onedayeventins',
    src: '/assets/images/icon-twitter.svg',
    alt: 'Twitter',
  },
  {
    href: 'https://www.linkedin.com/company/one-day-event-insurance/',
    src: '/assets/images/icon-linkedin.svg',
    alt: 'LinkedIn',
  },
  {
    href: 'https://www.pinterest.com/onedayeventinsurance/',
    src: '/assets/images/icon-pinterest.svg',
    alt: 'Pinterest',
  },
]

export function Footer() {
  const { data: navPages = [] } = useNavPages()

  return (
    <footer className="bg-[#F8F8F8] border-t border-[#E3E3E3]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">

        {/* ── Main footer row ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-8">

          {/* Left: Logo + nav links */}
          <div className="flex flex-wrap items-start gap-10">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/assets/images/logo-img.svg" alt="" className="h-10 w-auto" />
              <img src="/assets/images/logo-text2.svg" alt="One Day Event Insurance" className="h-5 w-auto" />
            </Link>

            {/* Nav columns */}
            <div className="flex flex-wrap gap-10">

              {/* Partners */}
              <div>
                <p className="text-[13px] font-[900] text-[#262D45] mb-3 uppercase tracking-wide">Partners</p>
                <ul className="space-y-1.5">
                  {[
                    { to: '/partner-signup?type=agent',   label: 'Insurance Agents' },
                    { to: '/partner-signup?type=planner', label: 'Event Planners' },
                    { to: '/partner-signup?type=venue',   label: 'Venue Partners' },
                    { to: '/affiliate-signup',            label: 'Other' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className="text-[13.5px] font-semibold text-[#262D45] hover:text-[#4EA5D9] transition-colors"
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Learn */}
              <div>
                <p className="text-[13px] font-[900] text-[#262D45] mb-3 uppercase tracking-wide">Learn</p>
                <ul className="space-y-1.5">
                  {[
                    { to: '/about',   label: 'About Us' },
                    { to: '/faq',     label: "FAQ's" },
                    { to: '/blog',    label: 'Blog' },
                    { to: '/privacy', label: 'Privacy' },
                    { to: '/terms',   label: 'Terms' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        className="text-[13.5px] font-semibold text-[#262D45] hover:text-[#4EA5D9] transition-colors"
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                  {navPages.map(p => (
                    <li key={p.id}>
                      <NavLink
                        to={`/pages/${p.slug}`}
                        className="text-[13.5px] font-semibold text-[#262D45] hover:text-[#4EA5D9] transition-colors"
                      >
                        {p.navbar_text ?? p.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[13px] font-[900] text-[#262D45] mb-3 uppercase tracking-wide">Contact</p>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="mailto:support@onedayevent.com"
                      className="text-[13.5px] font-semibold text-[#262D45] hover:text-[#4EA5D9] transition-colors"
                    >
                      support@onedayevent.com
                    </a>
                  </li>
                  <li>
                    <NavLink
                      to="/contact"
                      className="text-[13.5px] font-semibold text-[#262D45] hover:text-[#4EA5D9] transition-colors"
                    >
                      Contact Form
                    </NavLink>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* Right: Get a Quote CTA + Social */}
          <div className="flex flex-col items-start sm:items-end gap-5">
            <Link
              to="/onedayevent"
              className="inline-block bg-[#1CA0DF] text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-[#1786BB] transition-colors shadow-sm"
            >
              Get a Quote
            </Link>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ href, src, alt }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label={alt}
                >
                  <img src={src} alt={alt} className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Copyright bar ────────────────────────────────────────────── */}
        <div className="mt-8 pt-5 border-t border-[#E3E3E3] flex flex-col sm:flex-row items-center justify-between gap-2">
          <strong className="text-[12px] font-[900] text-[#262D45] tracking-wide uppercase">
            © {new Date().getFullYear()} ONEDAYEVENT
          </strong>
          <p className="text-[12px] text-[#797979]">
            Event insurance products are subject to underwriting approval.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Layout shell ─────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
}

export default function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
