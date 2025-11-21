import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Pencil, Trash2, X } from 'lucide-react'

function ReminderCard({ reminder, formatCurrency, onEdit, onDelete }){
  const daysLeft = Math.ceil((new Date(reminder.dueDate) - new Date())/(1000*60*60*24))
  const status = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : daysLeft <= 3 ? 'Due soon' : ''
  const chip = status && (
    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
      {status}
    </span>
  )
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
      <div className="mt-1 text-2xl font-extrabold">{formatCurrency(reminder.amount)}</div>
      <div className="text-sm text-muted">Due {reminder.dueDate} • {daysLeft >= 0 ? `${daysLeft} day(s) left` : `Overdue by ${-daysLeft} day(s)`}</div>
      {reminder.category && <div className="text-xs text-muted">Category: {reminder.category}</div>}
    </div>
  )
}

export default function Reminders(){
  const { state, addReminder, updateReminder, deleteReminder, formatCurrency, fromBase } = useFinance()
  const emptyForm = { title:'', amount:'', dueDate: new Date().toISOString().slice(0,10), recurring:'Monthly', category:'', description:'' }
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const reminders = [...state.reminders].sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))

  const submit = (e)=>{
    e.preventDefault()
    if(!form.title || !form.amount) return
    if (editing){
      updateReminder(editing.id, { ...form, amount: Number(form.amount) })
    } else {
      addReminder({ ...form, amount: Number(form.amount) })
    }
    setForm(emptyForm)
    setEditing(null)
  }

  const startEdit = (reminder) => {
    setEditing(reminder)
    setForm({ ...reminder, amount: fromBase(reminder.amount), dueDate: reminder.dueDate })
  }

  const handleDelete = (reminder) => {
    if (window.confirm(`Delete reminder "${reminder.title}"?`)){
      deleteReminder(reminder.id)
      if (editing?.id === reminder.id){
        setEditing(null)
        setForm(emptyForm)
      }
    }
  }

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
      {reminders.length === 0 ? (
        <div className="card bg-panel2 text-sm text-muted">No reminders yet. Add one above to start tracking due dates.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map(r => (
            <ReminderCard
              key={r.id}
              reminder={r}
              formatCurrency={formatCurrency}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
