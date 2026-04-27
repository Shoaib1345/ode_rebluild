import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const NAV = [
  {
    to: '/planner', end: true,
    label: 'Dashboard',
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>,
  },
  {
    to: '/planner/referrals', end: false,
    label: 'My Referrals',
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
  },
  {
    to: '/planner/commissions', end: false,
    label: 'Commissions & W9',
    icon: <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd"/></svg>,
  },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/login', { replace: true })
    toast.success('Signed out.')
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#105778] text-white flex flex-col z-30 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <span className="text-lg font-bold">ODE</span>
          <span className="ml-2 text-white/50 text-xs">Planner Portal</span>
        </div>
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white/70 transition-colors">Sign out</button>
        </div>
      </aside>
    </>
  )
}

export default function PlannerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="text-[#105778] font-bold text-sm">ODE Planner Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
