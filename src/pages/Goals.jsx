import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'

function Goal({ title, target, saved, deadline }){
  const pct = Math.min(100, Math.round((Number(saved)/Math.max(1,Number(target)))*100))
  return (
    <div className="card">
      <div className="font-semibold mb-1">{title}</div>
      <div className="flex items-center text-sm text-muted mb-2">
        <span>Deadline: {deadline}</span>
        <span className="ml-auto">${Number(saved).toFixed(2)} / ${Number(target).toFixed(2)}</span>
      </div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{width:`${pct}%`}}/></div>
      <div className="text-xs text-muted mt-1">{pct}% complete</div>
    </div>
  )
}

export default function Goals(){
  const { state, addGoal } = useFinance()
  const [form, setForm] = useState({ title:'', target:'', saved:'', deadline: new Date().toISOString().slice(0,10) })
  const submit = (e)=>{ e.preventDefault(); if(!form.title || !form.target) return; addGoal({ ...form, target: Number(form.target), saved: Number(form.saved || 0) }); setForm({ title:'', target:'', saved:'', deadline: new Date().toISOString().slice(0,10) }) }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 font-semibold">Create Goal</div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
          <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Target" value={form.target} onChange={e=>setForm({...form, target:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Saved" value={form.saved} onChange={e=>setForm({...form, saved:e.target.value})} />
          <input className="input" type="date" value={form.deadline} onChange={e=>setForm({...form, deadline:e.target.value})} />
          <button className="btn btn-primary md:col-span-4">Add Goal</button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.goals.map(g => (<Goal key={g.id} {...g} />))}
      </div>
    </div>
  )
}
