import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/axios'

interface NavPage {
  id: number
  title: string
  navbar_text: string | null
  slug: string
}

function useNavPages() {
  return useQuery<NavPage[]>({
    queryKey: ['public-nav'],
    queryFn: () => api.get('/pages/nav').then(r => r.data),
    staleTime: 10 * 60 * 1000,
    placeholderData: [],
  })
}

interface Props {
  children: React.ReactNode
}

export default function PublicLayout({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: navPages = [] } = useNavPages()
  const location = useLocation()

  // Close mobile menu on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const staticLinks = [
    { to: '/blog',    label: 'Blog' },
    { to: '/about',   label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  const cmsLinks: { to: string; label: string }[] = navPages.map(p => ({
    to:    `/pages/${p.slug}`,
    label: p.navbar_text ?? p.title,
  }))

  const allLinks = [...cmsLinks, ...staticLinks]

  return (
    <div className="min-h-screen flex flex-col bg-[#EBEFF2]">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#105778] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Brand */}
          <Link to="/" className="text-lg font-bold tracking-tight hover:opacity-90 transition flex-shrink-0">
            One Day Event Insurance
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {allLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  'text-sm font-medium transition ' +
                  (isActive ? 'text-white underline underline-offset-4' : 'text-white/70 hover:text-white')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-white/70 hover:text-white transition"
            >
              Sign in
            </Link>
            <Link
              to="/onedayevent"
              className="bg-[#1CA0DF] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#1786BB] transition"
            >
              Get a Quote
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded hover:bg-white/10 transition"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0b3f57] border-t border-white/10 px-4 py-3 space-y-1">
            {allLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-white/80 hover:text-white transition"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-white/70 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/onedayevent"
                onClick={() => setMobileOpen(false)}
                className="block text-center bg-[#1CA0DF] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#1786BB] transition"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#262D45] text-gray-300 pt-12 pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

            {/* Brand column */}
            <div>
              <h3 className="text-white font-bold text-base mb-3">One Day Event Insurance</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Instant event insurance quotes from multiple carriers. Weddings, parties, concerts, and more.
              </p>
            </div>

            {/* Get covered */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Get Covered</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/onedayevent" className="hover:text-white transition">Get a Quote</Link></li>
                <li><Link to="/affiliate-signup" className="hover:text-white transition">Become an Affiliate</Link></li>
                <li><Link to="/partner-signup?type=agent" className="hover:text-white transition">Agent Program</Link></li>
                <li><Link to="/partner-signup?type=planner" className="hover:text-white transition">Venue / Planner Program</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
                {navPages.map(p => (
                  <li key={p.id}>
                    <Link to={`/pages/${p.slug}`} className="hover:text-white transition">
                      {p.navbar_text ?? p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-gray-500">
                  Event insurance products are subject to underwriting approval.
                  Coverage terms and conditions apply.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} One Day Event Insurance. All rights reserved.</p>
            <p>
              Questions?{' '}
              <a href="mailto:support@onedayevent.com" className="hover:text-gray-300 transition">
                support@onedayevent.com
              </a>
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
