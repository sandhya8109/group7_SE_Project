import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useFinance } from './FinanceContext'

const NotificationCtx = createContext()
const STORAGE_KEY = 'pfbms-notifications-v1'
const READ_KEY = 'pfbms-notifications-read-v1'

const defaultNotifications = [
  { id: 'ntf-celebrate', type: 'achievement', message: 'You saved $500 this month! 🎉', date: new Date().toISOString(), read: false }
]

export function NotificationProvider({ children }){
  const { state, totals, formatCurrency } = useFinance()
  const [customNotifications, setCustomNotifications] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultNotifications
  })
  const [readIds, setReadIds] = useState(() => {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customNotifications))
  }, [customNotifications])

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readIds)))
  }, [readIds])

  const systemAlerts = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().slice(0,10)
    const currentMonth = todayKey.slice(0,7)
    const alerts = []

    const budgetsByCat = state.budgets.filter(b => b.period === currentMonth)
    for(const budget of budgetsByCat){
      const spent = state.expenses
        .filter(e => e.category === budget.category && e.date?.startsWith(currentMonth))
        .reduce((sum, exp) => sum + Number(exp.amount || 0), 0)
      if (budget.limit && spent > budget.limit * 0.5){
        const pct = Math.round((spent / budget.limit) * 100)
        alerts.push({
          id: `overspending-${budget.category}`,
          type: 'overspending',
          message: `You have used ${pct}% of your ${budget.category} budget (${formatCurrency(budget.limit)} limit).`,
          date: now.toISOString(),
          read: false
        })
      }
    }

    const upcomingBills = state.reminders.filter(rem => {
      const due = new Date(rem.dueDate)
      const diff = (due - now) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })
    for(const bill of upcomingBills){
      const due = new Date(bill.dueDate)
      const diff = Math.ceil((due - now) / (1000*60*60*24))
      alerts.push({
        id: `bill-${bill.id}`,
        type: 'upcoming-bill',
        message: `${bill.title} (${formatCurrency(bill.amount)}) is due in ${diff} day${diff === 1 ? '' : 's'}.`,
        date: bill.dueDate,
        read: false
      })
    }

    const goalsSoon = state.goals.filter(goal => goal.deadline && (new Date(goal.deadline) - now)/(1000*60*60*24) <= 14)
    for(const goal of goalsSoon){
      alerts.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        message: `${goal.title} is due soon. Keep saving!`,
        date: goal.deadline,
        read: false
      })
    }

    if (totals.savings < 0){
      alerts.push({
        id: 'savings-warning',
        type: 'low-savings',
        message: `Savings dipped to ${formatCurrency(totals.savings)}. Review spending to stay on track.`,
        date: now.toISOString(),
        read: false
      })
    }

    return alerts
  }, [state.budgets, state.expenses, state.reminders, state.goals, totals, formatCurrency])

  const notifications = useMemo(() => {
    const deduped = new Map()
    for(const alert of [...systemAlerts, ...customNotifications]){
      deduped.set(alert.id, alert)
    }
    return Array.from(deduped.values())
      .map(item => ({ ...item, read: readIds.has(item.id) }))
      .sort((a,b) => new Date(b.date) - new Date(a.date))
  }, [systemAlerts, customNotifications, readIds])

  const unreadCount = notifications.reduce((count, notification) => count + (readIds.has(notification.id) ? 0 : 1), 0)

  const addNotification = ({ type = 'info', message }) => {
    setCustomNotifications(list => [{ id: crypto.randomUUID(), type, message, date: new Date().toISOString(), read: false }, ...list])
  }

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
    addNotification
  }

  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>
}

export const useNotifications = () => useContext(NotificationCtx)
