import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IcDashboard = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)
const IcLeads = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IcEdit = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
)
const IcDocument = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const IcUsers = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)
const IcMail = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)
const IcPage = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)
const IcBell = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)
const IcFile = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)
const IcCurrency = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IcUpload = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
)
const IcSettings = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IcFullscreen = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)
const IcMenu = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

// ─── Nav config ───────────────────────────────────────────────────────────────

const IcBot = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75h.008v.008H9.75V9.75zm4.5 0h.008v.008h-.008V9.75zM12 3v2.25M7.5 6h9a2.25 2.25 0 012.25 2.25v6A2.25 2.25 0 0116.5 16.5h-9A2.25 2.25 0 015.25 14.25v-6A2.25 2.25 0 017.5 6zm-3 6H3.75m16.5 0H19.5M9 16.5l-1.5 3m9-3l1.5 3" />
  </svg>
)

interface NavItem {
  label: string
  to: string
  icon: () => JSX.Element
  end?: boolean
}

// Top-level nav items (not part of an expandable group)
const TOP_NAV: NavItem[] = [
  { label: 'Dashboard',        to: '/admin',                  icon: IcDashboard,  end: true },
  { label: 'Invoices',         to: '/admin/invoices',         icon: IcDocument },
  { label: 'Blog',             to: '/admin/blog',             icon: IcEdit },
  { label: 'Users / CSRs',     to: '/admin/users',            icon: IcUsers },
  { label: 'Email Templates',  to: '/admin/email-templates',  icon: IcMail },
  { label: 'Chatbot Q&A',      to: '/admin/chatbot',          icon: IcBot },
  { label: 'CMS Pages',        to: '/admin/pages',            icon: IcPage },
  { label: 'Subscribers',      to: '/admin/subscribers',      icon: IcBell },
  { label: 'W9 Forms',         to: '/admin/w9',               icon: IcFile },
  { label: 'Payroll',          to: '/admin/payroll',          icon: IcCurrency },
  { label: 'Rate Import',      to: '/admin/rate-import',      icon: IcUpload },
]

// Leads sub-menu — matches production exactly
const LEAD_SUB_ITEMS = [
  { label: 'All Leads',       to: '/admin/leads'            },
  { label: 'Priority Leads',  to: '/admin/leads/priority'   },
  { label: 'Sold Leads',      to: '/admin/leads/sold'       },
  { label: 'Past Leads',      to: '/admin/leads/past'       },
  { label: 'All Follow Up',   to: '/admin/leads/follow-up'  },
  { label: 'Future Leads',    to: '/admin/leads/future'     },
  { label: 'Untouched Leads', to: '/admin/leads/untouched'  },
  { label: 'Bound Leads',     to: '/admin/leads/bound'      },
  { label: 'Cancel Leads',    to: '/admin/leads/cancelled'  },
  { label: 'Untouch Leads',   to: '/admin/leads/untouch'    },
  { label: 'My Leads',        to: '/admin/leads/my'         },
]

// Small icon used for each sub-item row
const IcSubRow = () => (
  <svg className="h-3.5 w-3.5 flex-shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

const IcChevron = ({ open }: { open: boolean }) => (
  <svg
    className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const IcChat = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
)
// ─── Layout ───────────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: ReactNode
  title?: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [sidebarOpen,  setSidebarOpen]  = useState(false)        // mobile overlay
  const [desktopCollapsed, setDesktopCollapsed] = useState(false) // lg+ collapse
  const [, setFullscreen]   = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  // The hamburger toggles the mobile overlay on small screens AND collapses the
  // fixed sidebar on desktop. Each state only takes effect at its own breakpoint
  // (mobile overlay is lg:hidden; desktop sidebar is hidden below lg), so toggling
  // both is safe and gives the button an effect on every screen size.
  const toggleSidebar = () => {
    setSidebarOpen(o => !o)
    setDesktopCollapsed(c => !c)
  }
  // Auto-expand Leads when any leads sub-route is active
  const [leadsOpen, setLeadsOpen] = useState(() => location.pathname.startsWith('/admin/leads'))

  // Unread chat messages — drives the sidebar badge. Polls every 20s.
  const { data: chatUnread } = useQuery({
    queryKey: ['admin-chat-unread'],
    queryFn: async () => {
      const res = await api.get('/admin/chat/unread-count')
      return res.data.unread_count as number
    },
    refetchInterval: 20000,
  })

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
    toast.success('Signed out.')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  // Nav link classes
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors w-full ${
      isActive
        ? 'bg-[#E8F4FD] text-[#1CA0DF] font-semibold'
        : 'text-[#555E6D] hover:bg-gray-100 hover:text-gray-900'
    }`

  const avatarInitials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'

  const sidebarBody = (
    <div className="flex flex-col h-full">
      {/* "Navigation" section label */}
      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">

        {/* Dashboard (always first) */}
        <NavLink
          to="/admin"
          end
          className={linkCls}
          onClick={() => setSidebarOpen(false)}
        >
          <IcDashboard />
          <span>Dashboard</span>
        </NavLink>

        {/* ── Leads expandable group ──────────────────────────────────── */}
        <div>
          <button
            type="button"
            onClick={() => setLeadsOpen(o => !o)}
            className={`flex items-center justify-between w-full px-3 py-[9px] rounded-lg text-[13px] font-medium transition-colors ${
              location.pathname.startsWith('/admin/leads')
                ? 'bg-[#E8F4FD] text-[#1CA0DF] font-semibold'
                : 'text-[#555E6D] hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <IcLeads />
              Leads
            </span>
            <IcChevron open={leadsOpen} />
          </button>

          {/* Sub-items */}
          {leadsOpen && (
            <div className="ml-3 mt-0.5 pl-3 border-l border-gray-200 space-y-0.5">
              {LEAD_SUB_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2 py-[7px] rounded-md text-[12.5px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E8F4FD] text-[#1CA0DF] font-semibold'
                        : 'text-[#6B7280] hover:bg-gray-50 hover:text-gray-800'
                    }`
                  }
                >
                  <IcSubRow />
                  {item.label}
                </NavLink>
              ))}

              {/* Create Lead inline */}
              <NavLink
                to="/admin/leads/new"
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2 py-[7px] rounded-md text-[12.5px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E8F4FD] text-[#1CA0DF] font-semibold'
                      : 'text-[#6B7280] hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <IcSubRow />
                Create Lead
              </NavLink>
            </div>
          )}
        </div>

        {/* ── Chat ────────────────────────────────────────────────────── */}
        <NavLink
          to="/admin/chat"
          className={linkCls}
          onClick={() => setSidebarOpen(false)}
        >
          <span className="flex items-center gap-2.5">
            <IcChat />
            Chat
          </span>
          {chatUnread && chatUnread > 0 ? (
            <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-[#E0232C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {chatUnread}
            </span>
          ) : null}
        </NavLink>

        {/* ── Other flat nav items ────────────────────────────────────── */}
        {TOP_NAV.filter(i => i.to !== '/admin').map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkCls}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#1CA0DF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {avatarInitials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F3F8]">

      {/* ── Blue top bar ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-[#1CA0DF] flex items-center px-4 gap-3 shadow-sm">

        {/* Hamburger */}
        <button
          onClick={toggleSidebar}
          className="text-white/80 hover:text-white transition-colors p-1 rounded"
          aria-label="Toggle menu"
        >
          <IcMenu />
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/assets/images/logo-img.svg" alt="" className="h-9 w-auto" />
          <div className="leading-none hidden sm:block">
            <p className="text-white text-[12px] font-black tracking-tight">ONE DAY EVENT</p>
            <p className="text-white/60 text-[9px] tracking-widest uppercase">Just Enjoy</p>
          </div>
        </Link>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-1">

          {/* Notification bell */}
          <button
            className="relative text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            onClick={() => toast('No new notifications', { icon: '🔔' })}
            aria-label="Notifications"
          >
            <IcBell />
            <span className="absolute top-1.5 right-1.5 w-[14px] h-[14px] bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center leading-none">
              0
            </span>
          </button>

          {/* Fullscreen */}
          <button
            className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <IcFullscreen />
          </button>

          {/* Settings */}
          <button
            className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            aria-label="Settings"
            onClick={() => navigate('/admin/settings')}
          >
            <IcSettings />
          </button>

          {/* User avatar + profile menu */}
          <div className="relative ml-1">
            <button
              onClick={() => setProfileMenuOpen((o) => !o)}
              title={`Signed in as ${user?.first_name ?? ''}`}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white text-sm font-bold flex-shrink-0 border border-white/30"
            >
              {avatarInitials}
            </button>

            {profileMenuOpen && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />

                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                >
                  {/* Header */}
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1CA0DF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.first_name} {user?.last_name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <button
                    role="menuitem"
                    onClick={() => { setProfileMenuOpen(false); navigate('/admin/settings?tab=profile') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 0115 0v.75H4.5v-.75z"/></svg>
                    My Profile
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setProfileMenuOpen(false); navigate('/admin/settings?tab=security') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
                    Change Password
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setProfileMenuOpen(false); navigate('/admin/settings') }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <IcSettings />
                    Account Settings
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      role="menuitem"
                      onClick={() => { setProfileMenuOpen(false); handleLogout() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Sidebar + content ───────────────────────────────────────────────── */}
      <div className="flex pt-[60px] min-h-screen">

        {/* Desktop sidebar — visible lg+, collapsible via the hamburger */}
        <aside className={`${desktopCollapsed ? 'hidden' : 'hidden lg:flex'} flex-col w-[220px] bg-white border-r border-gray-200 fixed top-[60px] bottom-0 left-0 z-30 overflow-y-auto`}>
          {sidebarBody}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative flex flex-col w-[220px] bg-white z-50 top-[60px] bottom-0 overflow-y-auto">
              {sidebarBody}
            </aside>
          </div>
        )}

        {/* Main content — shifts to fill the space when the sidebar collapses */}
        <main className={`flex-1 min-h-screen transition-all duration-200 ${desktopCollapsed ? 'lg:pl-0' : 'lg:pl-[220px]'}`}>
          <div className="p-5 lg:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
