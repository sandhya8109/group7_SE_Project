import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { fetchTransactions, fetchBudgets, fetchReminders, fetchGoals } from '../api/client'

const NotificationCtx = createContext()
const READ_KEY = 'pfbms-notifications-read-v1'

export function NotificationProvider({ children }){
  const { user, token } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [reminders, setReminders] = useState([])
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [readIds, setReadIds] = useState(() => {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  })

  // Fetch all data needed for notifications
  const fetchAllData = useCallback(async () => {
    if (!user || !user.user_id) return
    
    setIsLoading(true)
    try {
      const [txns, budgetsData, remindersData, goalsData] = await Promise.all([
        fetchTransactions(user.user_id, token).catch(() => []),
        fetchBudgets(user.user_id, token).catch(() => []),
        fetchReminders(user.user_id, token).catch(() => []),
        fetchGoals(user.user_id, token).catch(() => [])
      ])
      
      setTransactions(txns)
      setBudgets(budgetsData)
      setReminders(remindersData)
      setGoals(goalsData)
    } catch (error) {
      console.error('Failed to fetch notification data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, token])

  useEffect(() => {
    fetchAllData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchAllData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readIds)))
  }, [readIds])

  // Calculate totals from transactions
  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type?.toLowerCase() === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const expense = transactions
      .filter(t => t.type?.toLowerCase() === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return {
      income,
      expense,
      savings: income - expense
    }
  }, [transactions])

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
    } catch {
      return `$${Number(amount).toFixed(2)}`
    }
  }

  const systemAlerts = useMemo(() => {
    if (isLoading) return []
    
    const now = new Date()
    const todayKey = now.toISOString().slice(0,10)
    const alerts = []

    // Budget alerts - check budgets against expenses in their date range
    for(const budget of budgets){
      const spent = transactions
        .filter(t => 
          t.type?.toLowerCase() === 'expense' &&
          t.category === budget.category &&
          t.date >= budget.start_date &&
          t.date <= budget.end_date
        )
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      
      if (budget.amount && spent > budget.amount * 0.5){
        const pct = Math.round((spent / budget.amount) * 100)
        alerts.push({
          id: `overspending-${budget.budget_id}`,
          type: 'overspending',
          message: `You have used ${pct}% of your ${budget.category} budget (${formatCurrency(budget.amount)} limit).`,
          date: now.toISOString(),
          read: false
        })
      }
    }

    // Reminder alerts
    const reminderStatuses = reminders.map(rem => {
      const due = new Date(rem.dueDate)
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) return { ...rem, status: 'overdue', diffDays }
      if (diffDays === 0) return { ...rem, status: 'due-today', diffDays }
      if (diffDays <= 7) return { ...rem, status: 'due-soon', diffDays }
      return { ...rem, status: 'later', diffDays }
    }).filter(rem => ['overdue','due-today','due-soon'].includes(rem.status))

    for(const bill of reminderStatuses){
      const label = bill.status === 'overdue' 
        ? 'was due' 
        : bill.status === 'due-today' 
        ? 'is due today' 
        : `is due in ${bill.diffDays} day${bill.diffDays === 1 ? '' : 's'}`
      
      alerts.push({
        id: `bill-${bill.id || bill.reminder_id}`,
        type: bill.status,
        message: `${bill.title} (${formatCurrency(bill.amount)}) ${label}.`,
        date: bill.dueDate,
        read: false
      })
    }

    // Goal alerts - goals approaching deadline
    const goalsSoon = goals.filter(goal => {
      if (!goal.deadline) return false
      const daysUntil = (new Date(goal.deadline) - now) / (1000*60*60*24)
      return daysUntil <= 14 && daysUntil >= 0
    })
    
    for(const goal of goalsSoon){
      const daysLeft = Math.ceil((new Date(goal.deadline) - now) / (1000*60*60*24))
      alerts.push({
        id: `goal-${goal.goal_id}`,
        type: 'goal',
        message: `${goal.name} deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Keep saving!`,
        date: goal.deadline,
        read: false
      })
    }

    // Low savings warning
    if (totals.savings < 0){
      alerts.push({
        id: 'savings-warning',
        type: 'low-savings',
        message: `Savings dipped to ${formatCurrency(totals.savings)}. Review spending to stay on track.`,
        date: now.toISOString(),
        read: false
      })
    }

    // Achievement notification - saved over $500 this month
    const currentMonth = todayKey.slice(0,7)
    const monthlyIncome = transactions
      .filter(t => t.type?.toLowerCase() === 'income' && t.date?.startsWith(currentMonth))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const monthlyExpense = transactions
      .filter(t => t.type?.toLowerCase() === 'expense' && t.date?.startsWith(currentMonth))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const monthlySavings = monthlyIncome - monthlyExpense
    
    if (monthlySavings >= 500){
      alerts.push({
        id: 'achievement-500',
        type: 'achievement',
        message: `You saved ${formatCurrency(monthlySavings)} this month! 🎉`,
        date: now.toISOString(),
        read: false
      })
    }

    return alerts
  }, [budgets, transactions, reminders, goals, totals, isLoading])

  const notifications = useMemo(() => {
    return systemAlerts
      .map(item => ({ ...item, read: readIds.has(item.id) }))
      .sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [systemAlerts, readIds])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)))
  }

  const value = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    isLoading
  }

  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>
}

export const useNotifications = () => useContext(NotificationCtx)