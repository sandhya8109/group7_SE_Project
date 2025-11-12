import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout({ children }){
  const { user, logout } = useAuth()
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
        <div className="mt-auto text-xs text-muted">Signed in as<br/>{user?.email}</div>
      </aside>
      <main className="grid grid-rows-[60px_1fr]">
        <header className="flex items-center justify-between px-4 border-b border-slate-700/60 bg-panel">
          <div className="flex items-center gap-2 md:hidden text-lg font-bold">💸 PFBMS</div>
          <div className="flex-1"></div>
          <button onClick={logout} className="btn btn-ghost text-sm">Logout</button>
        </header>
        <div className="p-4">{children}</div>
      </main>
    </div>
  )
}
