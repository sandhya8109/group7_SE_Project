import React, { useMemo, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts'

const sectionTitle = 'text-lg font-semibold mb-2'

export default function Reports(){
  const { state, setState, formatCurrency, fromBase } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7))
  const [importMessage, setImportMessage] = useState(null)

  const availableMonths = useMemo(() => {
    const keys = new Set()
    for(const arr of [state.incomes, state.expenses]){
      for(const item of arr){
        if(item.date) keys.add(item.date.slice(0,7))
      }
    }
    return Array.from(keys).sort().reverse()
  }, [state.incomes, state.expenses])
  const monthOptions = useMemo(() => {
    const year = selectedMonth.slice(0,4) || new Date().getFullYear().toString()
    const fullYearMonths = Array.from({ length: 12 }, (_, idx) => `${year}-${String(idx + 1).padStart(2,'0')}`)
    const options = new Set([...fullYearMonths, ...availableMonths, selectedMonth])
    return Array.from(options).sort().reverse()
  }, [availableMonths, selectedMonth])

  const categoryData = useMemo(()=>{
    const m = {}; for(const e of state.expenses){ m[e.category]=(m[e.category]||0)+fromBase(e.amount) }
    return Object.entries(m).map(([category,total])=>({ category,total }))
  }, [state.expenses, fromBase])

  const { annualData, totalAnnualSavingsBase } = useMemo(()=>{
    const monthlyMap = {}
    for(const income of state.incomes){
      const key = income.date.slice(0,7)
      monthlyMap[key] = monthlyMap[key] || { month: key, income: 0, expense: 0 }
      monthlyMap[key].income += Number(income.amount)
    }
    for(const expense of state.expenses){
      const key = expense.date.slice(0,7)
      monthlyMap[key] = monthlyMap[key] || { month: key, income: 0, expense: 0 }
      monthlyMap[key].expense += Number(expense.amount)
    }
    const values = Object.values(monthlyMap).sort((a,b) => a.month.localeCompare(b.month))
    return {
      annualData: values.map(row => ({ month: row.month, income: fromBase(row.income), expense: fromBase(row.expense), savings: fromBase(row.income - row.expense) })),
      totalAnnualSavingsBase: values.reduce((sum,row)=>sum + (row.income - row.expense),0)
    }
  }, [state.incomes, state.expenses, fromBase])

  const monthlySummary = useMemo(() => {
    const income = state.incomes.filter(i => i.date.startsWith(selectedMonth)).reduce((s,i)=>s+Number(i.amount),0)
    const expenses = state.expenses.filter(e => e.date.startsWith(selectedMonth)).reduce((s,e)=>s+Number(e.amount),0)
    const categories = state.expenses.filter(e => e.date.startsWith(selectedMonth)).reduce((acc,exp)=>{
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount)
      return acc
    }, {})
    const biggest = state.expenses.filter(e => e.date.startsWith(selectedMonth)).sort((a,b)=>b.amount-a.amount)[0]
    const prev = new Date(selectedMonth + '-01')
    prev.setMonth(prev.getMonth() - 1)
    const prevKey = prev.toISOString().slice(0,7)
    const prevNet = state.incomes.filter(i => i.date.startsWith(prevKey)).reduce((s,i)=>s+Number(i.amount),0) -
      state.expenses.filter(e => e.date.startsWith(prevKey)).reduce((s,e)=>s+Number(e.amount),0)
    const currentNet = income - expenses
    const trendDiff = currentNet - prevNet
    return {
      income,
      expenses,
      savings: currentNet,
      categories,
      biggest,
      trend: trendDiff
    }
  }, [state.incomes, state.expenses, fromBase, selectedMonth])

  const exportData = (format) => {
    const payload = {
      exportedAt: new Date().toISOString(),
      currency: state.currency,
      incomes: state.incomes,
      expenses: state.expenses,
      budgets: state.budgets,
      goals: state.goals,
      reminders: state.reminders
    }
    if(format === 'json'){
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      triggerDownload(blob, 'finance-report.json')
    }
    if(format === 'csv'){
      const header = 'type,date,name/category,amount,notes\n'
      const rows = [
        ...state.incomes.map(i => `income,${i.date},${i.source},${fromBase(i.amount)},${i.notes || ''}`),
        ...state.expenses.map(e => `expense,${e.date},${e.category} - ${e.name},${fromBase(e.amount)},${e.notes || ''}`)
      ]
      const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
      triggerDownload(blob, 'finance-report.csv')
    }
    if(format === 'pdf'){
      if(typeof window === 'undefined') return
      const win = window.open('', '_blank')
      win.document.write(`<pre style="font-family:monospace">${JSON.stringify(payload, null, 2)}</pre>`)
      win.document.close()
      win.focus()
      win.print()
    }
  }

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = (file) => {
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        setState(prev => ({
          ...prev,
          currency: data.currency || prev.currency,
          incomes: data.incomes || prev.incomes,
          expenses: data.expenses || prev.expenses,
          budgets: data.budgets || prev.budgets,
          goals: data.goals || prev.goals,
          reminders: data.reminders || prev.reminders
        }))
        setImportMessage({ text: 'Report imported successfully ✅', type: 'success' })
      } catch (err) {
        setImportMessage({ text: 'Could not parse the uploaded file ❌', type: 'error' })
      }
    }
    reader.readAsText(file)
  }

  const exportMonthlyPdf = () => {
    if(typeof window === 'undefined') return
    const html = `
      <h1>Monthly Report - ${selectedMonth}</h1>
      <p>Total income: ${formatCurrency(monthlySummary.income)}</p>
      <p>Total expenses: ${formatCurrency(monthlySummary.expenses)}</p>
      <p>Savings: ${formatCurrency(monthlySummary.savings)}</p>
    `
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const totalAnnualSavings = formatCurrency(totalAnnualSavingsBase)

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className={sectionTitle}>Data Export</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={()=>exportData('csv')}>Export CSV</button>
          <button className="btn btn-primary" onClick={()=>exportData('pdf')}>Export PDF</button>
          <button className="btn btn-primary" onClick={()=>exportData('json')}>Export JSON</button>
        </div>
        <div>
          <label className="label">Import JSON backup</label>
          <input type="file" accept="application/json" onChange={e=>importJson(e.target.files[0])} />
          {importMessage && <div className={`text-xs mt-1 ${importMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{importMessage.text}</div>}
        </div>
      </div>

      <div className="card space-y-4">
        <div className={sectionTitle}>Monthly Report Generator</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="label">Month</div>
            <select className="input" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
              {monthOptions.map(month => (<option key={month}>{month}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={exportMonthlyPdf}>Export summary as PDF</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card bg-panel2">
            <div className="label">Total Income</div>
            <div className="kpi text-xl">{formatCurrency(monthlySummary.income)}</div>
          </div>
          <div className="card bg-panel2">
            <div className="label">Total Expense</div>
            <div className="kpi text-xl">{formatCurrency(monthlySummary.expenses)}</div>
          </div>
          <div className="card bg-panel2">
            <div className="label">Savings</div>
            <div className="kpi text-xl">{formatCurrency(monthlySummary.savings)}</div>
          </div>
          <div className="card bg-panel2">
            <div className="label">Trend vs Previous Month</div>
            <div className="kpi text-xl">{monthlySummary.trend >= 0 ? '+' : ''}{formatCurrency(monthlySummary.trend)}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-2">Category Breakdown</div>
            <ul className="space-y-1 text-sm">
              {Object.entries(monthlySummary.categories).map(([cat,value]) => (
                <li key={cat} className="flex justify-between">
                  <span>{cat}</span>
                  <span>{formatCurrency(value)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Biggest Expense</div>
            {monthlySummary.biggest ? (
              <div className="p-3 border border-slate-700/60 rounded-xl">
                <div className="font-semibold">{monthlySummary.biggest.name}</div>
                <div className="text-sm text-muted">{monthlySummary.biggest.category}</div>
                <div className="font-bold">{formatCurrency(monthlySummary.biggest.amount)}</div>
              </div>
            ) : <div className="text-sm text-muted">No expenses recorded.</div>}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className={sectionTitle}>Annual Performance</div>
        <div className="text-sm text-muted">Total savings this year: <span className="font-semibold text-white">{totalAnnualSavings}</span></div>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={annualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="savings" stroke="#6366f1" name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className={sectionTitle}>Spending by Category</div>
        <div className="h-96">
          <ResponsiveContainer>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" /><YAxis /><Tooltip />
              <Bar dataKey="total" name="Amount" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
