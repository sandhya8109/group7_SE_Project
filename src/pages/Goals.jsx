import React, { useState } from 'react'
import { useFinance } from '../context/FinanceContext'

function GoalCard({ goal, onEdit, onAddMoney, onDelete, formatCurrency }){
  const pct = Math.min(100, Math.round((Number(goal.saved)/Math.max(1,Number(goal.target)))*100))
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{goal.title}</div>
        <div className="text-xs text-muted">Due {goal.deadline}</div>
      </div>
      <div className="text-sm text-muted flex items-center">
        <span>{formatCurrency(goal.saved)} / {formatCurrency(goal.target)}</span>
        <span className="ml-auto font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden"><div className={`h-full ${pct >= 100 ? 'bg-emerald-400' : 'bg-green-500'}`} style={{width:`${pct}%`}}/></div>
      <div className="flex gap-2 flex-wrap text-xs">
        <button className="btn btn-ghost text-xs" onClick={()=>onAddMoney(goal)}>Add Savings</button>
        <button className="btn btn-ghost text-xs" onClick={()=>onEdit(goal)}>Edit</button>
        <button className="btn btn-ghost text-xs text-red-400" onClick={()=>onDelete(goal.id)}>Delete</button>
      </div>
    </div>
  )
}

export default function Goals(){
  const { state, addGoal, updateGoal, deleteGoal, addGoalContribution, distributeSavings, formatCurrency, fromBase } = useFinance()
  const [form, setForm] = useState({ title:'', target:'', saved:'', deadline: new Date().toISOString().slice(0,10) })
  const [editGoal, setEditGoal] = useState(null)
  const [contributeGoal, setContributeGoal] = useState(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [distributionAmount, setDistributionAmount] = useState('')

  const submit = (e)=>{
    e.preventDefault()
    if(!form.title || !form.target) return
    addGoal({ ...form })
    setForm({ title:'', target:'', saved:'', deadline: new Date().toISOString().slice(0,10) })
  }

  const openEdit = (goal) => {
    setEditGoal({ ...goal, targetDisplay: fromBase(goal.target), savedDisplay: fromBase(goal.saved) })
  }

  const saveEdit = (e) => {
    e.preventDefault()
    if(!editGoal) return
    updateGoal(editGoal.id, { title: editGoal.title, target: Number(editGoal.targetDisplay), saved: Number(editGoal.savedDisplay), deadline: editGoal.deadline })
    setEditGoal(null)
  }

  const openContribution = (goal) => {
    setContributeGoal(goal)
    setContributionAmount('')
  }

  const addContribution = (e) => {
    e.preventDefault()
    if(!contributeGoal || !Number(contributionAmount)) return
    addGoalContribution(contributeGoal.id, Number(contributionAmount))
    setContributeGoal(null)
  }

  const removeGoal = (id) => {
    if(confirm('Delete this goal?')) deleteGoal(id)
  }

  const runDistribution = (e) => {
    e.preventDefault()
    if(!Number(distributionAmount)) return
    distributeSavings(Number(distributionAmount))
    setDistributionAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="font-semibold">Create Goal</div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
          <input className="input" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Target" value={form.target} onChange={e=>setForm({...form, target:e.target.value})} />
          <input className="input" type="number" step="0.01" placeholder="Saved" value={form.saved} onChange={e=>setForm({...form, saved:e.target.value})} />
          <input className="input" type="date" value={form.deadline} onChange={e=>setForm({...form, deadline:e.target.value})} />
          <button className="btn btn-primary md:col-span-4">Add Goal</button>
        </form>
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Smart Distribution</div>
        <form className="flex flex-wrap gap-3" onSubmit={runDistribution}>
          <input className="input max-w-xs" type="number" step="0.01" placeholder="Amount to distribute" value={distributionAmount} onChange={e=>setDistributionAmount(e.target.value)} />
          <button className="btn btn-primary">Distribute Savings</button>
        </form>
        <p className="text-xs text-muted mt-2">We prioritize urgent deadlines and remaining balances automatically.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onEdit={openEdit} onAddMoney={openContribution} onDelete={removeGoal} formatCurrency={formatCurrency} />
        ))}
        {state.goals.length === 0 && <div className="text-muted col-span-full">Create your first goal to see it here.</div>}
      </div>

      {editGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <form className="bg-panel border border-slate-700/60 rounded-2xl p-4 w-full max-w-lg space-y-3" onSubmit={saveEdit}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Edit Goal</div>
              <button type="button" className="btn btn-ghost text-sm" onClick={()=>setEditGoal(null)}>Close</button>
            </div>
            <input className="input" value={editGoal.title} onChange={e=>setEditGoal(g=>({...g,title:e.target.value}))} />
            <input className="input" type="number" step="0.01" value={editGoal.targetDisplay} onChange={e=>setEditGoal(g=>({...g,targetDisplay:e.target.value}))} />
            <input className="input" type="number" step="0.01" value={editGoal.savedDisplay} onChange={e=>setEditGoal(g=>({...g,savedDisplay:e.target.value}))} />
            <input className="input" type="date" value={editGoal.deadline} onChange={e=>setEditGoal(g=>({...g,deadline:e.target.value}))} />
            <button className="btn btn-primary">Save Goal</button>
          </form>
        </div>
      )}

      {contributeGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <form className="bg-panel border border-slate-700/60 rounded-2xl p-4 w-full max-w-md space-y-3" onSubmit={addContribution}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Add savings to {contributeGoal.title}</div>
              <button type="button" className="btn btn-ghost text-sm" onClick={()=>setContributeGoal(null)}>Close</button>
            </div>
            <input className="input" type="number" step="0.01" placeholder="Amount" value={contributionAmount} onChange={e=>setContributionAmount(e.target.value)} />
            <button className="btn btn-primary">Add Money</button>
          </form>
        </div>
      )}
    </div>
  )
}
