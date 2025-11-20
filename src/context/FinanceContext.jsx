import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FinanceCtx = createContext()
const LS_KEY = 'pfbms-state-v1'
const BASE_CURRENCY = 'USD'

export const currencyMap = {
  USD: { label: 'US Dollar', symbol: '$', rate: 1 },
  EUR: { label: 'Euro', symbol: '€', rate: 0.93 },
  GBP: { label: 'British Pound', symbol: '£', rate: 0.79 },
  INR: { label: 'Indian Rupee', symbol: '₹', rate: 83.25 },
  NPR: { label: 'Nepalese Rupee', symbol: '₨', rate: 132.9 },
  AUD: { label: 'Australian Dollar', symbol: 'A$', rate: 1.52 },
  CAD: { label: 'Canadian Dollar', symbol: 'C$', rate: 1.36 }
}

const defaultState = {
  currency: 'USD',
  incomes: [
    { id: 'inc-1', date: '2025-11-01', source: 'Salary', amount: 3500 },
    { id: 'inc-2', date: '2025-11-05', source: 'Freelance', amount: 500 },
  ],
  expenses: [
    { id: 'exp-1', date: '2025-11-02', time: '10:00', name: 'Groceries', category: 'Food', amount: 120, notes: '', receipt: null },
    { id: 'exp-2', date: '2025-11-03', time: '18:30', name: 'Uber', category: 'Transport', amount: 22.5, notes: '', receipt: null },
    { id: 'exp-3', date: '2025-11-04', time: '21:00', name: 'Netflix', category: 'Entertainment', amount: 15.99, notes: 'Subscription', receipt: null },
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

  const rateFor = (currency = state.currency) => currencyMap[currency]?.rate || 1
  const toBase = (amount, currency = state.currency) => Number(amount || 0) / rateFor(currency)
  const fromBase = (amount, currency = state.currency) => Number(amount || 0) * rateFor(currency)
  const formatCurrency = (amount, currency = state.currency) => {
    const converted = fromBase(amount, currency)
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(converted)
    } catch (err) {
      const symbol = currencyMap[currency]?.symbol || ''
      return `${symbol}${converted.toFixed(2)}`
    }
  }

  const totals = useMemo(() => {
    const income = state.incomes.reduce((s,i)=>s+Number(i.amount||0),0)
    const expense = state.expenses.reduce((s,e)=>s+Number(e.amount||0),0)
    const savings = income - expense
    return { income, expense, savings }
  }, [state.incomes, state.expenses])

  const addExpense = (exp) => setState(s => ({ ...s, expenses: [{ id: crypto.randomUUID(), ...exp, amount: toBase(exp.amount), receipt: exp.receipt || null }, ...s.expenses] }))
  const updateExpense = (id, updates) => setState(s => ({ ...s, expenses: s.expenses.map(e => e.id === id ? { ...e, ...updates, amount: updates.amount !== undefined ? toBase(updates.amount) : e.amount } : e) }))
  const removeExpense = (id) => setState(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) }))

  const addIncome = (income) => setState(s => ({ ...s, incomes: [{ id: crypto.randomUUID(), ...income, amount: toBase(income.amount) }, ...s.incomes] }))
  const removeIncome = (id) => setState(s => ({ ...s, incomes: s.incomes.filter(i => i.id !== id) }))

  const addBudget = (b) => setState(s => ({ ...s, budgets: [{ id: crypto.randomUUID(), ...b, limit: toBase(b.limit) }, ...s.budgets] }))
  const addReminder = (r) => setState(s => ({ ...s, reminders: [{ id: crypto.randomUUID(), ...r, amount: toBase(r.amount) }, ...s.reminders] }))
  const updateReminder = (id, updates) => setState(s => ({
    ...s,
    reminders: s.reminders.map(rem => rem.id === id ? { ...rem, ...updates, amount: updates.amount !== undefined ? toBase(updates.amount) : rem.amount } : rem)
  }))
  const deleteReminder = (id) => setState(s => ({ ...s, reminders: s.reminders.filter(rem => rem.id !== id) }))
  const addGoal = (g) => setState(s => ({ ...s, goals: [{ id: crypto.randomUUID(), ...g, target: toBase(g.target), saved: toBase(g.saved || 0) }, ...s.goals] }))
  const updateGoal = (id, updates) => setState(s => ({
    ...s,
    goals: s.goals.map(goal => goal.id === id ? {
      ...goal,
      ...updates,
      target: updates.target !== undefined ? toBase(updates.target) : goal.target,
      saved: updates.saved !== undefined ? toBase(updates.saved) : goal.saved
    } : goal)
  }))
  const deleteGoal = (id) => setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }))
  const addGoalContribution = (id, amount) => setState(s => ({
    ...s,
    goals: s.goals.map(goal => goal.id === id ? { ...goal, saved: goal.saved + toBase(amount) } : goal)
  }))

  const distributeSavings = (amount) => {
    const baseAmount = toBase(amount)
    if (!baseAmount) return
    setState(s => {
      const remaining = s.goals.map(goal => ({
        ...goal,
        remaining: Math.max(goal.target - goal.saved, 0),
        urgency: goal.deadline ? new Date(goal.deadline).getTime() : Infinity
      }))
      const sorted = remaining.sort((a,b)=>{
        if (a.remaining === 0 && b.remaining === 0) return 0
        const urgencyDiff = a.urgency - b.urgency
        if (urgencyDiff !== 0) return urgencyDiff
        return b.remaining - a.remaining
      })
      let leftover = baseAmount
      const updatedGoals = s.goals.map(g => ({ ...g }))
      for(const goalMeta of sorted){
        if (leftover <= 0) break
        const idx = updatedGoals.findIndex(g => g.id === goalMeta.id)
        if (idx === -1) continue
        const targetRemaining = Math.max(goalMeta.remaining, 0)
        const allocation = targetRemaining === 0 ? leftover / sorted.length : Math.min(leftover, targetRemaining)
        updatedGoals[idx] = { ...updatedGoals[idx], saved: updatedGoals[idx].saved + allocation }
        leftover -= allocation
      }
      return { ...s, goals: updatedGoals }
    })
  }

  const value = {
    state,
    setState,
    totals,
    addExpense,
    updateExpense,
    removeExpense,
    addIncome,
    removeIncome,
    addBudget,
    addReminder,
    updateReminder,
    deleteReminder,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalContribution,
    distributeSavings,
    currencyMap,
    formatCurrency,
    fromBase,
    toBase,
    rateFor,
    baseCurrency: BASE_CURRENCY
  }
  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>
}

export const useFinance = () => useContext(FinanceCtx)
