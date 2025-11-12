import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FinanceCtx = createContext()
const LS_KEY = 'pfbms-state-v1'

const defaultState = {
  currency: 'USD',
  incomes: [
    { id: 'inc-1', date: '2025-11-01', source: 'Salary', amount: 3500 },
    { id: 'inc-2', date: '2025-11-05', source: 'Freelance', amount: 500 },
  ],
  expenses: [
    { id: 'exp-1', date: '2025-11-02', name: 'Groceries', category: 'Food', amount: 120, notes: '' },
    { id: 'exp-2', date: '2025-11-03', name: 'Uber', category: 'Transport', amount: 22.5, notes: '' },
    { id: 'exp-3', date: '2025-11-04', name: 'Netflix', category: 'Entertainment', amount: 15.99, notes: 'Subscription' },
  ],
  budgets: [
    { id: 'bud-1', period: '2025-11', category: 'Food', limit: 400 },
    { id: 'bud-2', period: '2025-11', category: 'Transport', limit: 150 },
    { id: 'bud-3', period: '2025-11', category: 'Entertainment', limit: 80 },
  ],
  reminders: [
    { id: 'rem-1', title: 'Rent', dueDate: '2025-11-30', amount: 950, recurring: 'Monthly' },
    { id: 'rem-2', title: 'Internet', dueDate: '2025-11-20', amount: 60, recurring: 'Monthly' },
  ],
  goals: [
    { id: 'goal-1', title: 'Emergency Fund', target: 3000, saved: 1200, deadline: '2026-02-01' },
    { id: 'goal-2', title: 'Vacation', target: 1500, saved: 300, deadline: '2026-06-01' },
  ]
}

export function FinanceProvider({ children }){
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : defaultState
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  }, [state])

  const totals = useMemo(() => {
    const income = state.incomes.reduce((s,i)=>s+Number(i.amount||0),0)
    const expense = state.expenses.reduce((s,e)=>s+Number(e.amount||0),0)
    const savings = income - expense
    return { income, expense, savings }
  }, [state.incomes, state.expenses])

  const addExpense = (exp) => setState(s => ({ ...s, expenses: [{ id: crypto.randomUUID(), ...exp }, ...s.expenses] }))
  const removeExpense = (id) => setState(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) }))
  const addBudget = (b) => setState(s => ({ ...s, budgets: [{ id: crypto.randomUUID(), ...b }, ...s.budgets] }))
  const addReminder = (r) => setState(s => ({ ...s, reminders: [{ id: crypto.randomUUID(), ...r }, ...s.reminders] }))
  const addGoal = (g) => setState(s => ({ ...s, goals: [{ id: crypto.randomUUID(), ...g }, ...s.goals] }))

  const value = { state, setState, totals, addExpense, removeExpense, addBudget, addReminder, addGoal }
  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>
}

export const useFinance = () => useContext(FinanceCtx)
