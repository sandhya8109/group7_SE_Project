import React, { useMemo, useState } from 'react'
import { useFinance } from '../context/FinanceContext'

function BudgetCard({ category, limit, spent }){
  const pct = Math.min(100, Math.round((spent/Math.max(1,limit))*100))
  const over = spent > limit
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{category}</div>
        <div className={"text-xs px-2 py-1 rounded-full " + (over? 'bg-red-500/20 text-red-300':'bg-green-500/20 text-green-300')}>
          {over? 'Over':'Under'}
        </div>
      </div>
      <div className="text-sm text-muted mb-2">Limit: ${Number(limit).toFixed(2)} • Used: {pct}%</div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden">
        <div className={"h-full "+(over? 'bg-red-500':'bg-accent')} style={{width:`${pct}%`}}/>
      </div>
    </div>
  )
}

export default function Budgets(){
  const { state, addBudget } = useFinance()
  const [form, setForm] = useState({ period: new Date().toISOString().slice(0,7), category:'Food', limit:'' })
  const spentByCategory = useMemo(()=>{
    const map = {}; for(const e of state.expenses){ if(e.date.startsWith(form.period)){ map[e.category]=(map[e.category]||0)+Number(e.amount) } } return map
  }, [state.expenses, form.period])

  const submit = (e)=>{ e.preventDefault(); if(!form.limit) return; addBudget({ ...form, limit: Number(form.limit) }); setForm({ ...form, limit:'' }) }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 font-semibold">Create Budget</div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-3">
          <input className="input" type="month" value={form.period} onChange={e=>setForm({...form, period:e.target.value})} />
          <select className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            <option>Food</option><option>Transport</option><option>Utilities</option><option>Entertainment</option><option>Shopping</option><option>Other</option>
          </select>
          <div className="flex gap-2">
            <input className="input flex-1" type="number" step="0.01" placeholder="Limit" value={form.limit} onChange={e=>setForm({...form, limit:e.target.value})} />
            <button className="btn btn-primary">Add</button>
          </div>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.budgets.filter(b => b.period === form.period).map(b => (
          <BudgetCard key={b.id} category={b.category} limit={b.limit} spent={spentByCategory[b.category] || 0} />
        ))}
      </div>
    </div>
  )
}
