import React, { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useNotifications } from '../context/NotificationContext'
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'

export default function Dashboard(){
  const { state, totals, formatCurrency, fromBase } = useFinance()
  const { notifications } = useNotifications()
  const pie = Object.entries(state.expenses.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+Number(e.amount); return acc },{}))
    .map(([name,value]) => ({ name, value: fromBase(value) }))
  const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa','#14b8a6']

  const monthly = (()=>{
    const mapInc={}, mapExp={}
    for(const i of state.incomes){ const k=i.date.slice(0,7); mapInc[k]=(mapInc[k]||0)+fromBase(i.amount) }
    for(const e of state.expenses){ const k=e.date.slice(0,7); mapExp[k]=(mapExp[k]||0)+fromBase(e.amount) }
    const keys=[...new Set([...Object.keys(mapInc),...Object.keys(mapExp)])].sort()
    return keys.map(k=>({ month:k, income: mapInc[k]||0, expense: mapExp[k]||0 }))
  })()

  const criticalAlerts = notifications.filter(n => ['overspending','upcoming-bill','goal','low-savings'].includes(n.type)).slice(0,4)

  return (
    <div className="space-y-4">
      {criticalAlerts.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="card flex items-start gap-3">
              <div className="text-2xl">{alert.type === 'overspending' ? '⚠️' : alert.type === 'upcoming-bill' ? '🕒' : alert.type === 'goal' ? '🎯' : '💡'}</div>
              <div>
                <div className="font-semibold">{alert.message}</div>
                <div className="text-xs text-muted">{new Date(alert.date).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><div className="label">Total Income</div><div className="kpi">{formatCurrency(totals.income)}</div></div>
        <div className="card"><div className="label">Total Expenses</div><div className="kpi">{formatCurrency(totals.expense)}</div></div>
        <div className="card"><div className="label">Savings</div><div className="kpi">{formatCurrency(totals.savings)}</div></div>
      </div>

      <div className="card md:col-span-2">
        <div className="mb-2 font-semibold">Income vs Expense</div>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis />
              <Tooltip />
              <Line dataKey="income" name="Income" />
              <Line dataKey="expense" name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="mb-2 font-semibold">Expense Breakdown</div>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" outerRadius={110}>
                {pie.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
