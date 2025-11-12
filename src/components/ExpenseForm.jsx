import React, { useState } from 'react'

export default function ExpenseForm({ onAdd }){
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), name:'', category:'Food', amount:'', notes:'' })
  const submit = (e) => {
    e.preventDefault()
    if(!form.name || !form.amount) return
    onAdd({ ...form, amount: Number(form.amount) })
    setForm({ ...form, name:'', amount:'', notes:'' })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-5 gap-2">
        <input type="date" className="input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <select className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
          <option>Food</option><option>Transport</option><option>Utilities</option><option>Entertainment</option><option>Shopping</option><option>Other</option>
        </select>
        <input type="number" step="0.01" className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
      </div>
      <button className="btn btn-primary" type="submit">Add Expense</button>
    </form>
  )
}
