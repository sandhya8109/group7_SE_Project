import React, { useMemo, useState, useEffect } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardSummary } from '../api/client'
//import { useNotifications } from '../context/NotificationContext'
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa','#14b8a6']

export default function Dashboard(){
  const { formatCurrency, fromBase } = useFinance()
  const { user, token } = useAuth()

  const [dashboardData, setDashboardData] = useState({
    totals: { income: 0, expense: 0, savings: 0 },
    monthly_trend: [],
    expense_breakdown: [],
    notifications: [],
    reminders: [],
    weekly_transactions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  // --- Data Fetching Effect ---
  useEffect(() => {
    // Only fetch if user and token are available
    if (!user || !user.user_id || !token) return
    
    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        // Call the new API endpoint
        const response = await fetchDashboardSummary(user.user_id, token) 
        setDashboardData(response) 
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Optionally update UI to show error
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user, token])


  const criticalAlerts = dashboardData.notifications
    // The API is designed to only send critical types, but we filter/limit just in case
    .filter(n => ['overspending','due-soon','due-today','overdue','goal','low-savings'].includes(n.type))
    .slice(0,4)

  const now = new Date()
  const startThisWeek = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d }, [])
  const startLastWeek = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 13); return d }, [])
  const inRange = (dateStr, start, end) => {
    const d = new Date(dateStr)
    return d >= start && d <= end
  }

  const { totalExpThisWeek, totalExpLastWeek, weeklySavings, topCategory, weekChange, insights } = useMemo(() => {
    const now = new Date()
    // Define the start/end date ranges (Logic is kept from original component)
    const startThisWeek = new Date(); startThisWeek.setDate(now.getDate() - 6);
    const startLastWeek = new Date(); startLastWeek.setDate(now.getDate() - 13);
    const inRange = (dateStr, start, end) => {
      // NOTE: We rely on the date string being precise enough. New Date(dateStr) is necessary.
      const d = new Date(dateStr)
      // Check if d is on or after start, and strictly before end (or today)
      return d.getTime() >= start.getTime() && d.getTime() <= now.getTime();
    }

  const expensesThisWeek = dashboardData.weekly_transactions.filter(e => e.type.toLowerCase() === 'expense' && inRange(e.date, startThisWeek, now))
  const expensesLastWeek = dashboardData.weekly_transactions.filter(e => e.type.toLowerCase() === 'expense' && inRange(e.date, startLastWeek, startThisWeek))
  const incomeThisWeek = dashboardData.weekly_transactions.filter(i => i.type.toLowerCase() === 'income' && inRange(i.date, startThisWeek, now))

  const getAmount = (txn) => Number(txn.amount);

  const totalExpThisWeek = expensesThisWeek.reduce((s,e)=>s+fromBase(e.amount),0)
  const totalExpLastWeek = expensesLastWeek.reduce((s,e)=>s+fromBase(e.amount),0)
  const weeklySavings = incomeThisWeek.reduce((s,i)=>s+getAmount(i),0) - totalExpThisWeek

  const highestCategory = expensesThisWeek.reduce((acc,e)=>{
      const key = e.category || 'Other'
      acc[key] = (acc[key]||0) + getAmount(e)
      return acc
    }, {})

  const [topCatName, topCatAmount] = Object.entries(highestCategory).sort((a,b)=>b[1]-a[1])[0] || [null, 0]
    const topCategory = topCatName ? [topCatName, topCatAmount] : null
    
    const weekChange = totalExpLastWeek ? Math.round(((totalExpThisWeek-totalExpLastWeek)/totalExpLastWeek)*100) : 0

    const insights = [
      topCategory ? `Top category this week: ${topCategory[0]} (${formatCurrency(topCategory[1])}).` : 'Spend in categories to see insights.',
      `You spent ${weekChange >= 0 ? weekChange : Math.abs(weekChange)}% ${weekChange >=0 ? 'more' : 'less'} than last week (${formatCurrency(totalExpThisWeek)} vs ${formatCurrency(totalExpLastWeek)}).`,
      `Savings left this week: ${formatCurrency(weeklySavings)}.`,
    ]

    return { totalExpThisWeek, totalExpLastWeek, weeklySavings, topCategory, weekChange, insights }
  }, [dashboardData.weekly_transactions, formatCurrency])

  const upcomingReminders = useMemo(() => {
    const today = new Date(new Date().setHours(0,0,0,0)) // Start of today
    return dashboardData.reminders
      .map(rem => ({
        ...rem,
        // Calculate days left, ensuring it handles date objects or strings
        daysLeft: Math.ceil((new Date(rem.dueDate).getTime() - today.getTime()) / (1000*60*60*24)) 
      }))
      .filter(rem => rem.daysLeft <= 7)
      .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [dashboardData.reminders])

  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Dashboard...</div>
  }

return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="card flex items-start gap-3">
              <div className="text-2xl">{alert.type === 'overspending' ? '⚠️' : ['upcoming-bill','due-soon','due-today','overdue'].includes(alert.type) ? '🕒' : alert.type === 'goal' ? '🎯' : '💡'}</div>
              <div>
                <div className="font-semibold">{alert.message}</div>
                <div className="text-xs text-muted">{new Date(alert.date).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* Use API data: dashboardData.totals */}
        <div className="card"><div className="label">Total Income</div><div className="kpi">{formatCurrency(dashboardData.totals.income)}</div></div>
        <div className="card"><div className="label">Total Expenses</div><div className="kpi">{formatCurrency(dashboardData.totals.expense)}</div></div>
        <div className="card"><div className="label">Savings</div><div className="kpi">{formatCurrency(dashboardData.totals.savings)}</div></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="font-semibold">Next 7 days reminders</div>
          {upcomingReminders.length === 0 && <div className="text-sm text-muted">No reminders due soon.</div>}
          <div className="space-y-2">
            {upcomingReminders.map(rem => (
              <div key={rem.id} className="flex items-center gap-3 rounded-xl bg-panel2 px-3 py-2">
                <div className="flex-1">
                  <div className="font-semibold">{rem.title}</div>
                  <div className="text-xs text-muted">Due {rem.dueDate}</div>
                </div>
                <div className="text-sm font-semibold">{formatCurrency(rem.amount)}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${rem.daysLeft < 0 ? 'bg-red-500/20 text-red-200' : rem.daysLeft === 0 ? 'bg-orange-500/20 text-orange-200' : 'bg-yellow-500/20 text-yellow-200'}`}>
                  {rem.daysLeft < 0 ? 'Overdue' : rem.daysLeft === 0 ? 'Today' : `${rem.daysLeft}d`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="font-semibold">Weekly spending patterns</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-muted">This week</div>
              <div className="text-xl font-bold">{formatCurrency(totalExpThisWeek)}</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-muted">Last week</div>
              <div className="text-xl font-bold">{formatCurrency(totalExpLastWeek)}</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-muted">Top category</div>
              <div className="text-xl font-bold">{topCategory ? topCategory[0] : '—'}</div>
            </div>
            <div className="rounded-xl bg-panel2 p-3">
              <div className="text-muted">Weekly savings</div>
              <div className="text-xl font-bold">{formatCurrency(weeklySavings)}</div>
            </div>
          </div>
          <ul className="text-sm list-disc list-inside text-muted space-y-1">
            {insights.map((tip, idx) => <li key={idx}>{tip}</li>)}
          </ul>
        </div>
      </div>

      <div className="card md:col-span-2">
        <div className="mb-2 font-semibold">Income vs Expense</div>
        <div className="h-72">
          <ResponsiveContainer>
            {/* Use API data: dashboardData.monthly_trend */}
            <LineChart data={dashboardData.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis />
              <Tooltip />
              <Line dataKey="income" name="Income" stroke="#22c55e" />
              <Line dataKey="expense" name="Expense" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="mb-2 font-semibold">Expense Breakdown</div>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              {/* Use API data: dashboardData.expense_breakdown */}
              <Pie data={dashboardData.expense_breakdown} dataKey="value" nameKey="name" outerRadius={110}>
                {dashboardData.expense_breakdown.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
