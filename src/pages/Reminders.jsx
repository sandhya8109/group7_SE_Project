import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'

function ReminderCard({ title, amount, dueDate, recurring, formatCurrency }){
  const daysLeft = Math.ceil((new Date(dueDate) - new Date())/(1000*60*60*24))
  const urgent = daysLeft <= 3
  return (
    <div className="card">
      <div className="flex items-center">
        <div className="font-semibold">{title}</div>
        {urgent && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">Due soon</span>}
        <div className="ml-auto text-sm text-muted">{recurring}</div>
      </div>
      <div className="mt-1 text-2xl font-extrabold">{formatCurrency(amount)}</div>
      <div className="text-sm text-muted">Due {dueDate} • {daysLeft >= 0 ? `${daysLeft} day(s) left` : `Overdue by ${-daysLeft} day(s)`}</div>
    </div>
  )
}

export default function Reminders(){
  const { state, addReminder, formatCurrency } = useFinance()
  const [form, setForm] = useState({ title:'', amount:'', dueDate: new Date().toISOString().slice(0,10), recurring:'Monthly' })
  const submit = (e)=>{ e.preventDefault(); if(!form.title || !form.amount) return; addReminder({ ...form, amount: Number(form.amount) }); setForm({ title:'', amount:'', dueDate: new Date().toISOString().slice(0,10), recurring:'Monthly' }) }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 font-semibold">Add Reminder</div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
          <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
          <input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
          <select className="input" value={form.recurring} onChange={e=>setForm({...form, recurring:e.target.value})}>
            <option>Monthly</option><option>Weekly</option><option>Yearly</option><option>One-time</option>
          </select>
          <button className="btn btn-primary md:col-span-4">Add Reminder</button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.reminders.map(r => <ReminderCard key={r.id} {...r} formatCurrency={formatCurrency} />)}
      </div>
    </div>
  )
}
