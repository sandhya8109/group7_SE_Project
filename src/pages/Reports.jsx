import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { fetchTransactions, createReport, fetchReports, deleteReport } from '../api/client'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts'

const sectionTitle = 'text-lg font-semibold mb-2'

// Helper function to extract YYYY-MM from various date formats
// Defined OUTSIDE the component to avoid initialization issues
const getMonthKey = (dateValue) => {
  if (!dateValue) return null
  const dateStr = dateValue.toString()
  
  // If it's already in YYYY-MM format, use it
  if (/^\d{4}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 7)
  }
  
  // Otherwise parse as Date and format
  const parsedDate = new Date(dateStr)
  if (!isNaN(parsedDate.getTime())) {
    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }
  
  return null
}

export default function Reports(){
  const { formatCurrency } = useFinance()
  const { user, token } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7))
  const [importMessage, setImportMessage] = useState(null)
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [savedReports, setSavedReports] = useState([])

  // --- Data Fetching Functions ---
  const fetchTransactionsData = useCallback(async () => {
    if (!user || !user.user_id) return;
    setIsLoading(true);
    try {
      const allTxns = await fetchTransactions(user.user_id, token);
      setIncomes(allTxns.filter(t => t.type?.toLowerCase() === 'income'));
      setExpenses(allTxns.filter(t => t.type?.toLowerCase() === 'expense'));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  const fetchSavedReports = useCallback(async () => {
    if (!user || !user.user_id) return;
    try {
      const reports = await fetchReports(user.user_id, token);
      setSavedReports(reports);
    } catch (error) {
      console.error('Failed to fetch saved reports:', error);
    }
  }, [user, token]);

  useEffect(() => {
    fetchTransactionsData();
    fetchSavedReports();
  }, [fetchTransactionsData, fetchSavedReports]);

  const categoryData = useMemo(()=>{
    const m = {}
    for(const e of expenses){ 
      m[e.category] = (m[e.category] || 0) + Number(e.amount)
    }
    return Object.entries(m).map(([category,total])=>({ category, total }))
  }, [expenses])

  const { annualData, totalAnnualSavingsBase } = useMemo(()=>{
    const monthlyMap = {}
    
    for(const income of incomes){
      const key = getMonthKey(income.date)
      if (!key) continue
      
      monthlyMap[key] = monthlyMap[key] || { month: key, income: 0, expense: 0 }
      monthlyMap[key].income += Number(income.amount)
    }
    
    for(const expense of expenses){
      const key = getMonthKey(expense.date)
      if (!key) continue
      
      monthlyMap[key] = monthlyMap[key] || { month: key, income: 0, expense: 0 }
      monthlyMap[key].expense += Number(expense.amount)
    }
    
    const values = Object.values(monthlyMap).sort((a,b) => a.month.localeCompare(b.month))
    return {
      annualData: values.map(row => ({ 
        month: row.month, 
        income: row.income, 
        expense: row.expense, 
        savings: row.income - row.expense 
      })),
      totalAnnualSavingsBase: values.reduce((sum,row)=>sum + (row.income - row.expense),0)
    }
  }, [incomes, expenses])

  const monthlySummary = useMemo(() => {
    // Helper to check if a date belongs to the selected month
    const dateMatchesMonth = (dateValue) => {
      const monthKey = getMonthKey(dateValue)
      return monthKey === selectedMonth
    }
    
    const income = incomes.filter(i => dateMatchesMonth(i.date)).reduce((s,i)=>s+Number(i.amount),0)
    const expenseTotal = expenses.filter(e => dateMatchesMonth(e.date)).reduce((s,e)=>s+Number(e.amount),0)
    const categories = expenses.filter(e => dateMatchesMonth(e.date)).reduce((acc,exp)=>{
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount)
      return acc
    }, {})
    const biggest = expenses.filter(e => dateMatchesMonth(e.date)).sort((a,b)=>Number(b.amount)-Number(a.amount))[0]
    
    // Calculate previous month key
    const [year, month] = selectedMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1)
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    
    const prevNet = incomes.filter(i => getMonthKey(i.date) === prevKey).reduce((s,i)=>s+Number(i.amount),0) -
      expenses.filter(e => getMonthKey(e.date) === prevKey).reduce((s,e)=>s+Number(e.amount),0)
    const currentNet = income - expenseTotal
    const trendDiff = currentNet - prevNet
    
    console.log('[DEBUG] Monthly Summary:', {
      selectedMonth,
      income,
      expenseTotal,
      categories,
      biggest,
      filteredIncomes: incomes.filter(i => dateMatchesMonth(i.date)).length,
      filteredExpenses: expenses.filter(e => dateMatchesMonth(e.date)).length
    })
    
    return {
      income,
      expenses: expenseTotal,
      savings: currentNet,
      categories,
      biggest,
      trend: trendDiff
    }
  }, [incomes, expenses, selectedMonth])

  const monthOptions = useMemo(() => {
    const keys = new Set()
    
    // Add all months that have transactions
    for(const arr of [incomes, expenses]){
      for(const item of arr){
        const monthKey = getMonthKey(item.date)
        if (monthKey) keys.add(monthKey)
      }
    }
    
    // Always include current month even if no transactions
    const currentMonth = new Date().toISOString().slice(0,7)
    keys.add(currentMonth)
    
    // Sort in reverse chronological order (newest first)
    return Array.from(keys).sort().reverse()
  }, [incomes, expenses])

  const exportData = (format) => {
    const payload = {
      exportedAt: new Date().toISOString(),
      incomes: incomes,
      expenses: expenses,
      monthlySummary: monthlySummary,
      annualData: annualData
    }
    
    if(format === 'json'){
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      triggerDownload(blob, `finance-report-${new Date().toISOString().slice(0,10)}.json`)
    }
    if(format === 'csv'){
      const header = 'type,date,name/category,amount,notes\n'
      const rows = [
        ...incomes.map(i => `income,${i.date},${i.source || 'Income'},${i.amount},${i.notes || ''}`),
        ...expenses.map(e => `expense,${e.date},${e.category} - ${e.name},${e.amount},${e.notes || ''}`)
      ]
      const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' })
      triggerDownload(blob, `finance-report-${new Date().toISOString().slice(0,10)}.csv`)
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

  const saveMonthlyReport = async () => {
    try {
      const reportData = {
        report_id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.user_id,
        type: 'monthly_summary',
        data: {
          month: selectedMonth,
          summary: monthlySummary,
          categoryBreakdown: monthlySummary.categories,
          biggestExpense: monthlySummary.biggest
        }
      }
      
      await createReport(reportData, token)
      await fetchSavedReports()
      setImportMessage({ text: 'Report saved successfully ✅', type: 'success' })
      setTimeout(() => setImportMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save report:', error)
      setImportMessage({ text: 'Failed to save report ❌', type: 'error' })
    }
  }

  const deleteSavedReport = async (reportId) => {
    if (!confirm('Delete this saved report?')) return
    
    try {
      await deleteReport(reportId, token)
      await fetchSavedReports()
      setImportMessage({ text: 'Report deleted ✅', type: 'success' })
      setTimeout(() => setImportMessage(null), 3000)
    } catch (error) {
      console.error('Failed to delete report:', error)
    }
  }

  const exportMonthlyPdf = () => {
    if(typeof window === 'undefined') return
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Monthly Report - ${selectedMonth}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          .summary { margin: 20px 0; }
          .summary-item { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Monthly Financial Report - ${selectedMonth}</h1>
        <div class="summary">
          <div class="summary-item">
            <span class="label">Total Income:</span> ${formatCurrency(monthlySummary.income)}
          </div>
          <div class="summary-item">
            <span class="label">Total Expenses:</span> ${formatCurrency(monthlySummary.expenses)}
          </div>
          <div class="summary-item">
            <span class="label">Net Savings:</span> ${formatCurrency(monthlySummary.savings)}
          </div>
          <div class="summary-item">
            <span class="label">Trend vs Previous Month:</span> ${monthlySummary.trend >= 0 ? '+' : ''}${formatCurrency(monthlySummary.trend)}
          </div>
        </div>
        <h2>Category Breakdown</h2>
        <ul>
          ${Object.entries(monthlySummary.categories).map(([cat, val]) => 
            `<li><strong>${cat}:</strong> ${formatCurrency(val)}</li>`
          ).join('')}
        </ul>
        ${monthlySummary.biggest ? `
          <h2>Biggest Expense</h2>
          <div class="summary-item">
            <div><strong>${monthlySummary.biggest.name}</strong></div>
            <div>${monthlySummary.biggest.category}</div>
            <div>${formatCurrency(monthlySummary.biggest.amount)}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const totalAnnualSavings = formatCurrency(totalAnnualSavingsBase)

  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Reports...</div>
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className={sectionTitle}>Data Export</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={()=>exportData('csv')}>Export CSV</button>
          <button className="btn btn-primary" onClick={()=>exportData('pdf')}>Export PDF</button>
          <button className="btn btn-primary" onClick={()=>exportData('json')}>Export JSON</button>
        </div>
        {importMessage && (
          <div className={`text-sm p-2 rounded ${importMessage.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
            {importMessage.text}
          </div>
        )}
      </div>

      {savedReports.length > 0 && (
        <div className="card space-y-3">
          <div className={sectionTitle}>Saved Reports</div>
          <div className="space-y-2">
            {savedReports.map(report => (
              <div key={report.report_id} className="flex items-center justify-between p-3 border border-slate-700/60 rounded-xl">
                <div>
                  <div className="font-semibold">{report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div className="text-xs text-muted">
                    {report.data?.month || 'N/A'} • Created {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  className="btn btn-ghost text-xs text-red-400" 
                  onClick={() => deleteSavedReport(report.report_id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <div className={sectionTitle}>Monthly Report Generator</div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="label">Month</div>
            <select className="input" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}>
              {monthOptions.map(month => (<option key={month}>{month}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={exportMonthlyPdf}>Export as PDF</button>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={saveMonthlyReport}>Save Report</button>
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
              {Object.keys(monthlySummary.categories).length === 0 && (
                <li className="text-muted">No expenses recorded for this month.</li>
              )}
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