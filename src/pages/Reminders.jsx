import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Pencil, Trash2, X } from 'lucide-react'

function ReminderCard({ title, amount, dueDate, recurring, formatCurrency }){
  const daysLeft = Math.ceil((new Date(dueDate) - new Date())/(1000*60*60*24))
  const urgent = daysLeft <= 3
  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <div className="font-semibold truncate" title={reminder.title}>{reminder.title}</div>
        {chip}
        <div className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span>{reminder.recurring}</span>
          <button className="p-1 rounded hover:bg-panel2" onClick={() => onEdit(reminder)} aria-label="Edit reminder"><Pencil className="w-4 h-4" /></button>
          <button className="p-1 rounded hover:bg-panel2" onClick={() => onDelete(reminder)} aria-label="Delete reminder"><Trash2 className="w-4 h-4 text-red-400" /></button>
        </div>
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
        <div className="mb-3 flex items-center justify-between font-semibold">
          <span>{editing ? 'Edit Reminder' : 'Add Reminder'}</span>
          {editing && (
            <button className="text-xs text-muted inline-flex items-center gap-1" onClick={() => { setEditing(null); setForm(emptyForm) }}>
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-6">
          <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          <input className="input" placeholder="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
          <input className="input md:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
          <input className="input" type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} />
          <select className="input" value={form.recurring} onChange={e=>setForm({...form, recurring:e.target.value})}>
            <option>Monthly</option><option>Weekly</option><option>Yearly</option><option>One-time</option>
          </select>
          <button className="btn btn-primary md:col-span-6">{editing ? 'Save Changes' : 'Add Reminder'}</button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.reminders.map(r => <ReminderCard key={r.id} {...r} formatCurrency={formatCurrency} />)}
      </div>
    </div>
  )
}
