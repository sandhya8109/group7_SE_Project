import React, { useMemo, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'

function BudgetCard({ category, limit, spent, formatCurrency, onEdit, onDelete }){
  const pct = Math.min(100, Math.round((spent/Math.max(1,limit))*100))
  const over = spent > limit
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <div className="font-semibold">{category}</div>
        <div className={"text-xs px-2 py-1 rounded-full " + (over? 'bg-red-500/20 text-red-300':'bg-green-500/20 text-green-300')}>
          {over? 'Over':'Under'}
        </div>
        <div className="ml-auto flex items-center gap-1 text-muted">
          <button className="p-1 rounded hover:bg-panel2" onClick={onEdit} aria-label={`Edit ${category} budget`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-panel2" onClick={onDelete} aria-label={`Delete ${category} budget`}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      <div className="text-sm text-muted mb-2">Limit: {formatCurrency(limit)} • Used: {pct}%</div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden">
        <div className={"h-full "+(over? 'bg-red-500':'bg-accent')} style={{width:`${pct}%`}}/>
      </div>
    </div>
  )
}

export default function Budgets(){
  const { state, addBudget, updateBudget, deleteBudget, formatCurrency, fromBase } = useFinance()
  const initialForm = { period: new Date().toISOString().slice(0,7), category:'Food', limit:'' }
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const spentByCategory = useMemo(()=>{
    const map = {}; for(const e of state.expenses){ if(e.date.startsWith(form.period)){ map[e.category]=(map[e.category]||0)+Number(e.amount) } } return map
  }, [state.expenses, form.period])

  const submit = (e)=>{
    e.preventDefault()
    if(!form.limit) return
    if (editing){
      updateBudget(editing.id, { ...form, limit: Number(form.limit) })
    } else {
      addBudget({ ...form, limit: Number(form.limit) })
    }
    setForm({ ...form, limit:'' })
    setEditing(null)
  }

  const startEdit = (budget) => {
    setEditing(budget)
    setForm({ period: budget.period, category: budget.category, limit: fromBase(budget.limit) })
  }

  const handleDelete = (budget) => {
    if (window.confirm(`Delete ${budget.category} budget for ${budget.period}?`)){
      deleteBudget(budget.id)
      if (editing?.id === budget.id){
        setEditing(null)
        setForm(initialForm)
      }
    }
  }

  const budgetsForPeriod = state.budgets.filter(b => b.period === form.period)

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between font-semibold">
          <span>{editing ? 'Edit Budget' : 'Create Budget'}</span>
          {editing && (
            <button className="text-xs text-muted inline-flex items-center gap-1" onClick={() => { setEditing(null); setForm(initialForm) }}>
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-3">
          <input className="input" type="month" value={form.period} onChange={e=>setForm({...form, period:e.target.value})} />
          <select className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            <option>Food</option><option>Transport</option><option>Utilities</option><option>Entertainment</option><option>Shopping</option><option>Other</option>
          </select>
          <div className="flex gap-2">
            <input className="input flex-1" type="number" step="0.01" placeholder="Limit" value={form.limit} onChange={e=>setForm({...form, limit:e.target.value})} />
            <button className="btn btn-primary">{editing ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
      {budgetsForPeriod.length === 0 ? (
        <div className="card bg-panel2 text-sm text-muted">
          No budgets for this month yet. Add one above to unlock edit/delete actions.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetsForPeriod.map(b => (
            <BudgetCard
              key={b.id}
              category={b.category}
              limit={b.limit}
              spent={spentByCategory[b.category] || 0}
              formatCurrency={formatCurrency}
              onEdit={() => startEdit(b)}
              onDelete={() => handleDelete(b)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
