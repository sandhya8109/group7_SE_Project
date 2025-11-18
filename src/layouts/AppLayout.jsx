import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'

export default function AppLayout({ children }){
  const { user, profile, logout } = useAuth()
  const nav = (to, label) => (
    <NavLink to={to} className={({isActive}) => ['block px-3 py-2 rounded-xl', isActive?'bg-panel2 text-white':'text-muted hover:bg-panel2'].join(' ')}>{label}</NavLink>
  )
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr]">
      <aside className="hidden md:flex flex-col gap-2 bg-panel border-r border-slate-700/60 p-4">
        <div className="text-xl font-extrabold">💸 PFBMS</div>
        {nav('/', 'Dashboard')}
        {nav('/expenses', 'Expenses')}
        {nav('/budgets', 'Budgets')}
        {nav('/goals', 'Goals')}
        {nav('/reminders', 'Reminders')}
        {nav('/reports', 'Reports')}
        {nav('/settings', 'Settings')}
        <div className="mt-auto text-xs text-muted">Signed in as<br/>{profile?.name || user?.email}</div>
      </aside>
      <main className="grid grid-rows-[60px_1fr]">
        <header className="flex items-center justify-between px-4 border-b border-slate-700/60 bg-panel">
          <div className="flex items-center gap-2 md:hidden text-lg font-bold">💸 PFBMS</div>
          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell />
            <div className="flex items-center gap-3">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={profile.name || 'Profile'} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-panel2 flex items-center justify-center text-sm font-semibold">
                  {(profile?.name || user?.email || '?').slice(0,2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold">{profile?.name || 'You'}</div>
                <div className="text-xs text-muted">{profile?.email || user?.email}</div>
              </div>
            </div>
            <button onClick={logout} className="btn btn-ghost text-sm">Logout</button>
          </div>
        </header>
        <div className="p-4">{children}</div>
      </main>
    </div>
  )
}
