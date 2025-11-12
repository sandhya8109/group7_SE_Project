import React from 'react'
import { useFinance } from '../context/FinanceContext'
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'

export default function Dashboard(){
  const { state, totals } = useFinance()
  const pie = Object.entries(state.expenses.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+Number(e.amount); return acc },{}))
    .map(([name,value]) => ({ name, value }))
  const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#a78bfa','#14b8a6']

  const monthly = (()=>{
    const mapInc={}, mapExp={}
    for(const i of state.incomes){ const k=i.date.slice(0,7); mapInc[k]=(mapInc[k]||0)+Number(i.amount) }
    for(const e of state.expenses){ const k=e.date.slice(0,7); mapExp[k]=(mapExp[k]||0)+Number(e.amount) }
    const keys=[...new Set([...Object.keys(mapInc),...Object.keys(mapExp)])].sort()
    return keys.map(k=>({ month:k, income: mapInc[k]||0, expense: mapExp[k]||0 }))
  })()

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card"><div className="label">Total Income</div><div className="kpi">${totals.income.toFixed(2)}</div></div>
      <div className="card"><div className="label">Total Expenses</div><div className="kpi">${totals.expense.toFixed(2)}</div></div>
      <div className="card"><div className="label">Savings</div><div className="kpi">${totals.savings.toFixed(2)}</div></div>

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
