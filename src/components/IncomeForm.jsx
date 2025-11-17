import React, { useState } from 'react'

const defaultForm = () => ({
  date: new Date().toISOString().slice(0,10),
  source: '',
  amount: '',
  notes: ''
})

export default function IncomeForm({ onAdd }){
  const [form, setForm] = useState(defaultForm())

  const submit = (e) => {
    e.preventDefault()
    if(!form.source || !form.amount) return
    onAdd({ ...form })
    setForm(defaultForm())
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-4 gap-2">
        <input type="date" className="input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <input className="input" placeholder="Income source" value={form.source} onChange={e=>setForm({...form, source:e.target.value})} />
        <input type="number" step="0.01" className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        <input className="input" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
      </div>
      <button className="btn btn-primary">Add Income</button>
    </form>
  )
}
