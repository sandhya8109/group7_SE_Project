import React, { useState, useEffect, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { 
  fetchGoals, createGoal, updateGoal, deleteGoal 
} from '../api/client'

function GoalCard({ goal, onEdit, onAddMoney, onDelete, formatCurrency }){
  const pct = Math.min(100, Math.round((Number(goal.current_amount)/Math.max(1,Number(goal.target_amount)))*100))
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{goal.name}</div>
        <div className="text-xs text-muted">Due {goal.deadline || 'No deadline'}</div>
      </div>
      <div className="text-sm text-muted flex items-center">
        <span>{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
        <span className="ml-auto font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden">
        <div className={`h-full ${pct >= 100 ? 'bg-emerald-400' : 'bg-green-500'}`} style={{width:`${pct}%`}}/>
      </div>
      <div className="flex gap-2 flex-wrap text-xs">
        <button className="btn btn-ghost text-xs" onClick={()=>onAddMoney(goal)}>Add Savings</button>
        <button className="btn btn-ghost text-xs" onClick={()=>onEdit(goal)}>Edit</button>
        <button className="btn btn-ghost text-xs text-red-400" onClick={()=>onDelete(goal.goal_id)}>Delete</button>
      </div>
    </div>
  )
}

export default function Goals(){
  const { formatCurrency } = useFinance()
  const { user, token } = useAuth()
  
  // Helper to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateValue) => {
    if (!dateValue) return ''
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [form, setForm] = useState({ 
    name: '', 
    target_amount: '', 
    current_amount: '', 
    deadline: new Date().toISOString().slice(0,10) 
  })
  const [editGoal, setEditGoal] = useState(null)
  const [contributeGoal, setContributeGoal] = useState(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // --- Data Fetching Functions ---
  const fetchGoalsData = useCallback(async () => {
    if (!user || !user.user_id) return;
    setIsLoading(true);
    try {
      const data = await fetchGoals(user.user_id, token);
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchGoalsData();
  }, [fetchGoalsData]);

  // --- CRUD Handlers ---
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.target_amount) return
    
    try {
      const createData = {
        goal_id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.user_id,
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
        deadline: form.deadline || null
      }
      
      await createGoal(createData, token)
      setForm({ 
        name: '', 
        target_amount: '', 
        current_amount: '', 
        deadline: new Date().toISOString().slice(0,10) 
      })
      await fetchGoalsData()
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }

  const openEdit = (goal) => {
    setEditGoal({
      goal_id: goal.goal_id,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: normalizeDate(goal.deadline)
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editGoal) return
    
    try {
      const updateData = {
        name: editGoal.name,
        target_amount: Number(editGoal.target_amount),
        current_amount: Number(editGoal.current_amount),
        deadline: editGoal.deadline || null
      }
      
      await updateGoal(editGoal.goal_id, updateData, token)
      setEditGoal(null)
      await fetchGoalsData()
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  const openContribution = (goal) => {
    setContributeGoal(goal)
    setContributionAmount('')
  }

  const addContribution = async (e) => {
    e.preventDefault()
    if (!contributeGoal || !Number(contributionAmount)) return
    
    try {
      const newAmount = Number(contributeGoal.current_amount) + Number(contributionAmount)
      const updateData = {
        current_amount: newAmount
      }
      
      await updateGoal(contributeGoal.goal_id, updateData, token)
      setContributeGoal(null)
      setContributionAmount('')
      await fetchGoalsData()
    } catch (error) {
      console.error('Failed to add contribution:', error)
    }
  }

  const removeGoal = async (goalId) => {
    if (!confirm('Delete this goal?')) return
    
    try {
      await deleteGoal(goalId, token)
      await fetchGoalsData()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Goals...</div>
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="font-semibold">Create Goal</div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
          <input 
            className="input" 
            placeholder="Goal Name" 
            value={form.name} 
            onChange={e=>setForm({...form, name:e.target.value})} 
            required
          />
          <input 
            className="input" 
            type="number" 
            step="0.01" 
            placeholder="Target Amount" 
            value={form.target_amount} 
            onChange={e=>setForm({...form, target_amount:e.target.value})} 
            required
          />
          <input 
            className="input" 
            type="number" 
            step="0.01" 
            placeholder="Current Saved (optional)" 
            value={form.current_amount} 
            onChange={e=>setForm({...form, current_amount:e.target.value})} 
          />
          <input 
            className="input" 
            type="date" 
            value={form.deadline} 
            onChange={e=>setForm({...form, deadline:e.target.value})} 
          />
          <button className="btn btn-primary md:col-span-4" type="submit">Add Goal</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <GoalCard 
            key={goal.goal_id} 
            goal={goal} 
            onEdit={openEdit} 
            onAddMoney={openContribution} 
            onDelete={removeGoal} 
            formatCurrency={formatCurrency} 
          />
        ))}
        {goals.length === 0 && (
          <div className="card bg-panel2 text-sm text-muted col-span-full">
            Create your first goal to see it here.
          </div>
        )}
      </div>

      {editGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <form className="bg-panel border border-slate-700/60 rounded-2xl p-4 w-full max-w-lg space-y-3" onSubmit={saveEdit}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Edit Goal</div>
              <button type="button" className="btn btn-ghost text-sm" onClick={()=>setEditGoal(null)}>Close</button>
            </div>
            <input 
              className="input" 
              placeholder="Goal Name"
              value={editGoal.name} 
              onChange={e=>setEditGoal(g=>({...g, name:e.target.value}))} 
              required
            />
            <input 
              className="input" 
              type="number" 
              step="0.01" 
              placeholder="Target Amount"
              value={editGoal.target_amount} 
              onChange={e=>setEditGoal(g=>({...g, target_amount:e.target.value}))} 
              required
            />
            <input 
              className="input" 
              type="number" 
              step="0.01" 
              placeholder="Current Amount"
              value={editGoal.current_amount} 
              onChange={e=>setEditGoal(g=>({...g, current_amount:e.target.value}))} 
              required
            />
            <input 
              className="input" 
              type="date" 
              value={editGoal.deadline} 
              onChange={e=>setEditGoal(g=>({...g, deadline:e.target.value}))} 
            />
            <button className="btn btn-primary" type="submit">Save Goal</button>
          </form>
        </div>
      )}

      {contributeGoal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <form className="bg-panel border border-slate-700/60 rounded-2xl p-4 w-full max-w-md space-y-3" onSubmit={addContribution}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">Add savings to {contributeGoal.name}</div>
              <button type="button" className="btn btn-ghost text-sm" onClick={()=>setContributeGoal(null)}>Close</button>
            </div>
            <div className="text-sm text-muted mb-2">
              Current: {formatCurrency(contributeGoal.current_amount)} / {formatCurrency(contributeGoal.target_amount)}
            </div>
            <input 
              className="input" 
              type="number" 
              step="0.01" 
              placeholder="Amount to add" 
              value={contributionAmount} 
              onChange={e=>setContributionAmount(e.target.value)} 
              required
            />
            <button className="btn btn-primary" type="submit">Add Money</button>
          </form>
        </div>
      )}
    </div>
  )
}