import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { 
  fetchBudgets, createBudget, updateBudget, deleteBudget,
  fetchTransactions 
} from '../api/client'

// BudgetCard component remains the same, as the calculation is moved to the parent component
function BudgetCard({ budget, spent, formatCurrency, onEdit, onDelete }){
  const pct = Math.min(100, Math.round((spent/Math.max(1,budget.amount))*100))
  const over = spent > budget.amount
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{budget.category}</div>
        <div className="flex items-center gap-1 text-muted">
          <button className="p-1 rounded hover:bg-panel2" onClick={onEdit} aria-label={`Edit ${budget.category} budget`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-panel2" onClick={onDelete} aria-label={`Delete ${budget.category} budget`}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      <div className={"text-xs px-2 py-1 rounded-full inline-block mb-2 " + (over? 'bg-red-500/20 text-red-300':'bg-green-500/20 text-green-300')}>
        {over? 'Over Budget':'Under Budget'}
      </div>
      <div className="text-2xl font-extrabold mb-1">{formatCurrency(budget.amount)}</div>
      <div className="text-sm text-muted mb-2">
        Period: {budget.period} • {budget.start_date} to {budget.end_date}
      </div>
      <div className="text-sm text-muted mb-2">Spent: {formatCurrency(spent)} • {pct}% used</div>
      <div className="h-2 bg-panel2 rounded-full overflow-hidden">
        <div className={"h-full "+(over? 'bg-red-500':'bg-accent')} style={{width:`${pct}%`}}/>
      </div>
    </div>
  )
}

export default function Budgets(){
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
  
  // Helper to calculate start/end dates for the *current* period
  const getActualPeriodDates = (period) => {
    const today = new Date()
    let startDate, endDate
    
    // Determine the start and end of the current period based on the budget period type
    if (period === 'monthly') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Last day of current month
    } else if (period === 'weekly') {
      // Assuming week starts on Sunday (getDay() == 0)
      const dayOfWeek = today.getDay() 
      startDate = new Date(today)
      startDate.setDate(today.getDate() - dayOfWeek)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6) 
    } else if (period === 'yearly') {
      startDate = new Date(today.getFullYear(), 0, 1) // Jan 1
      endDate = new Date(today.getFullYear(), 11, 31) // Dec 31
    } else { // 'one-time' or unhandled period - use the budget's saved dates
      return null
    }

    return { 
      startDate: normalizeDate(startDate), 
      endDate: normalizeDate(endDate) 
    }
  }

  const initialForm = { 
    startDate: new Date().toISOString().slice(0,10),
    endDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      date.setDate(0); // Last day of current month
      return date.toISOString().slice(0,10);
    })(),
    period: 'monthly',
    category: 'Food', 
    amount: '' 
  }
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // --- Data Fetching Functions ---
  const fetchBudgetsData = useCallback(async () => {
    // ... (logic remains the same)
    if (!user || !user.user_id) return;
    setIsLoading(true);
    try {
      const data = await fetchBudgets(user.user_id, token);
      setBudgets(data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  const fetchExpensesData = useCallback(async () => {
    // ... (logic remains the same)
    if (!user || !user.user_id) return;
    try {
      // NOTE: For better performance with large data, ideally you'd filter
      // transactions by the max start/end dates of all active budgets on the API side.
      const allTxns = await fetchTransactions(user.user_id, token);
      setExpenses(allTxns.filter(t => t.type?.toLowerCase() === 'expense'));
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  }, [user, token]);

  useEffect(() => {
    fetchBudgetsData();
    fetchExpensesData();
  }, [fetchBudgetsData, fetchExpensesData]);

  // Calculate spending by category for the CURRENT period of each budget
  const getSpentForBudget = useCallback((budget) => {
    let total = 0
    
    // Determine the date range to check based on budget period
    let periodDates = null
    if (budget.period === 'one-time' || budget.period === 'custom') {
        // Use the saved start/end dates for one-time/custom budgets
        periodDates = { startDate: budget.start_date, endDate: budget.end_date }
    } else {
        // Use dynamically calculated dates for recurring budgets (monthly, weekly, yearly)
        periodDates = getActualPeriodDates(budget.period)
    }

    if (!periodDates) return 0 // Should not happen if period is valid

    const { startDate, endDate } = periodDates;
    
    // Filter expenses
    for (const e of expenses) {
      // Check for matching category AND if transaction date is within the calculated period
      if (e.category === budget.category && 
          e.date >= startDate && 
          e.date <= endDate) {
        total += Number(e.amount)
      }
    }
    return total
  }, [expenses]) // Dependency on expenses is correct

  // The rest of the component's logic remains the same

  // ... (CRUD handlers and other functions omitted for brevity) ...

  const submit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.startDate || !form.endDate) return
    
    try {
      if (editing) {
        // UPDATE operation
        const updateData = {
          category: form.category,
          amount: Number(form.amount),
          period: form.period,
          // Use normalized dates for consistency
          start_date: normalizeDate(form.startDate), 
          end_date: normalizeDate(form.endDate)
        }
        await updateBudget(editing, updateData, token)
      } else {
        // CREATE operation
        const createData = {
          budget_id: `bud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.user_id,
          category: form.category,
          amount: Number(form.amount),
          period: form.period,
          // Use normalized dates for consistency
          start_date: normalizeDate(form.startDate), 
          end_date: normalizeDate(form.endDate),
          is_exceeded: false
        }
        await createBudget(createData, token)
      }
      
      setForm({ ...form, amount: '' })
      setEditing(null)
      await fetchBudgetsData()
      // Re-fetch expenses to ensure the latest data is used for calculation immediately
      await fetchExpensesData() 
    } catch (error) {
      console.error(`Failed to ${editing ? 'update' : 'create'} budget:`, error)
    }
  }

  const startEdit = (budget) => {
    setEditing(budget.budget_id)
    setForm({ 
      startDate: normalizeDate(budget.start_date),
      endDate: normalizeDate(budget.end_date),
      period: budget.period, 
      category: budget.category, 
      amount: budget.amount 
    })
  }

  const handleDelete = async (budget) => {
    if (window.confirm(`Delete ${budget.category} budget (${budget.start_date} to ${budget.end_date})?`)) {
      try {
        await deleteBudget(budget.budget_id, token)
        
        if (editing === budget.budget_id) {
          setEditing(null)
          setForm(initialForm)
        }
        
        await fetchBudgetsData()
        await fetchExpensesData() // Refresh spending data
      } catch (error) {
        console.error('Failed to delete budget:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Budgets...</div>
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between font-semibold">
          <span>{editing ? 'Edit Budget' : 'Create Budget'}</span>
          {editing && (
            <button 
              className="text-xs text-muted inline-flex items-center gap-1" 
              onClick={() => { setEditing(null); setForm(initialForm) }}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>
        <form onSubmit={submit} className="grid gap-2 md:grid-cols-5">
          <input 
            className="input" 
            type="date" 
            value={form.startDate} 
            onChange={e=>setForm({...form, startDate:e.target.value})} 
            required
          />
          <input 
            className="input" 
            type="date" 
            value={form.endDate} 
            onChange={e=>setForm({...form, endDate:e.target.value})} 
            required
          />
          <select 
            className="input" 
            value={form.period} 
            onChange={e=>setForm({...form, period:e.target.value})}
            required
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
          <select 
            className="input" 
            value={form.category} 
            onChange={e=>setForm({...form, category:e.target.value})}
            required
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Shopping</option>
            <option>Other</option>
          </select>
          <div className="flex gap-2">
            <input 
              className="input flex-1" 
              type="number" 
              step="0.01" 
              placeholder="Limit" 
              value={form.amount} 
              onChange={e=>setForm({...form, amount:e.target.value})} 
              required
            />
            <button className="btn btn-primary" type="submit">
              {editing ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
      {budgets.length === 0 ? (
        <div className="card bg-panel2 text-sm text-muted">
          No budgets yet. Add one above to start tracking your spending limits.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map(b => (
            <BudgetCard
              key={b.budget_id}
              budget={b}
              spent={getSpentForBudget(b)}
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