import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext' 
import { fetchTransactions, createTransaction, deleteTransaction } from '../api/client' 
import ExpenseForm from '../components/ExpenseForm'
import IncomeForm from '../components/IncomeForm'
import TransactionTable from '../components/TransactionTable'
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const slotLabels = ['Morning','Afternoon','Evening','Night']

export default function Expenses(){
  const { formatCurrency, fromBase } = useFinance()
  const { user, token } = useAuth()
  const [tab, setTab] = useState('expense')
  const [receiptModal, setReceiptModal] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const [transactions, setTransactions] = useState({ incomes: [], expenses: [] });

  // --- Data Fetching Function (READ operation) ---
  const fetchTransactionsData = useCallback(async () => {
    if (!user || !user.user_id) return;
    setIsLoading(true);
    try {
        // Fetch all transactions for the user
        const allTxns = await fetchTransactions(user.user_id, token);
        
        // Filter and set local state
        setTransactions({
            incomes: allTxns.filter(t => t.type.toLowerCase() === 'income'),
            expenses: allTxns.filter(t => t.type.toLowerCase() === 'expense'),
        });
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
    } finally {
        setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  // --- CRUD Handlers ---

  const handleAddExpense = useCallback(async (data) => {
    if (!data.amount || !data.date || !data.name) {
        console.error("Missing required expense data.");
        return;
    }

    const transactionData = {
      type: 'expense',
      user_id: user.user_id,
      date: data.date,
      // Note: `time` is not in DB schema, but kept here if parent components need it.
      time: data.time, 
      name: data.name,
      category: data.category,
      amount: Number(data.amount),
      // Mapped notes to description as per previous change
      description: data.notes || '', 
      receipt_data: data.receipt || null,
    };
    
    try {
        await createTransaction(transactionData, token);
        await fetchTransactionsData();
    } catch (error) {
        console.error("Failed to create expense:", error);
        if (error.detail) console.error("API Detail:", error.detail);
        throw error;
    }
  }, [user, token, fetchTransactionsData]);

  const handleAddIncome = useCallback(async (data) => {
    if (!data.amount || !data.date || !data.name) {
        console.error("Missing required income data.");
        return;
    }

    const transactionData = {
      type: 'income',
      user_id: user.user_id,
      date: data.date,
      name: data.name, // FIX 1: Use `data.name`
      amount: Number(data.amount),
      description: data.notes || '', // Mapped notes to description
      category: data.category, // Assuming category is passed or handled
    };
    
    try {
        await createTransaction(transactionData, token);
        await fetchTransactionsData();
    } catch (error) {
        console.error("Failed to create income:", error);
        if (error.detail) console.error("API Detail:", error.detail);
        throw error;
    }
  }, [user, token, fetchTransactionsData]);

  // --- Data Deletion Function (DELETE operation) ---
  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
        await deleteTransaction(transactionId, user.user_id, token);
        await fetchTransactionsData();
        return true; 
    } catch (error) {
        console.error("Failed to delete transaction:", error);
        return false;
    }
  }, [user, token, fetchTransactionsData]);

  const totalsByCat = useMemo(() => {
    const map = {}; 
    for(const e of transactions.expenses){ map[e.category]=(map[e.category]||0)+Number(e.amount) } 
    return map
  }, [transactions.expenses])

  const spendingByDate = useMemo(() => {
    const map = {}
    for(const exp of transactions.expenses){
      map[exp.date] = (map[exp.date] || 0) + Number(exp.amount)
    }
    return Object.entries(map).sort(([a],[b]) => new Date(a) - new Date(b)).map(([date,total]) => ({ date, total }))
  }, [transactions.expenses])

  const heatmap = useMemo(() => {
    const template = dayNames.map(day => ({ day, Morning: 0, Afternoon: 0, Evening: 0, Night: 0 }))
    const slotFor = (time) => {
      const hour = Number((time || '12:00').split(':')[0])
      if(hour >= 5 && hour < 12) return 'Morning'
      if(hour >= 12 && hour < 17) return 'Afternoon'
      if(hour >= 17 && hour < 21) return 'Evening'
      return 'Night'
    }
    for(const exp of transactions.expenses){
      const date = new Date(exp.date)
      const dayIdx = date.getDay()
      const slot = slotFor(exp.time)
      template[dayIdx][slot] += fromBase(exp.amount)
    }
    return template
  }, [transactions.expenses, fromBase])

  const radarData = useMemo(() => Object.entries(totalsByCat).map(([category,value]) => ({ category, value: fromBase(value) })), [totalsByCat, fromBase])

  const insights = useMemo(() => {
    const list = []
    const weekendTotals = {}
    const weekdayTotals = {}
    const currentMonth = new Date().toISOString().slice(0,7)
    let startHalf = 0, endHalf = 0
    let eveningSpend = 0
    let entertainmentCurrent = 0, entertainmentPrev = 0
    const prevMonthDate = new Date()
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
    const prevMonthKey = prevMonthDate.toISOString().slice(0,7)

    for(const exp of transactions.expenses){
      const date = new Date(exp.date)
      const day = date.getDay()
      const target = (day === 0 || day === 6) ? weekendTotals : weekdayTotals
      target[exp.category] = (target[exp.category] || 0) + fromBase(exp.amount)
      const dayOfMonth = date.getDate()
      if(dayOfMonth <= 15) startHalf += fromBase(exp.amount)
      else endHalf += fromBase(exp.amount)
      const hour = Number((exp.time || '12:00').split(':')[0])
      if(hour >= 19 && hour <= 21) eveningSpend += fromBase(exp.amount)
      const monthKey = exp.date.slice(0,7)
      if(exp.category === 'Entertainment'){
        if(monthKey === currentMonth) entertainmentCurrent += fromBase(exp.amount)
        if(monthKey === prevMonthKey) entertainmentPrev += fromBase(exp.amount)
      }
    }

    const topWeekend = Object.entries(weekendTotals).sort((a,b)=>b[1]-a[1])[0]
    if(topWeekend && topWeekend[1] > 0){
      list.push(`You spend most on ${topWeekend[0]} during weekends.`)
    }
    if(endHalf > startHalf && endHalf > 0){
      list.push('Your expenses rise toward the end of each month—plan ahead!')
    }
    if(eveningSpend > 0){
      list.push('Your highest spending window is during 7–9 PM. Consider setting alerts for evening purchases.')
    }
    if(entertainmentPrev > 0 && entertainmentCurrent < entertainmentPrev){
      const change = Math.round((1 - entertainmentCurrent/entertainmentPrev) * 100)
      list.push(`You spent ${change}% less on Entertainment compared to last month. Nice job!`)
    }
    if(list.length === 0){
      list.push('Keep adding transactions to unlock personalized insights!')
    }
    return list
  }, [transactions.expenses, fromBase])

  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Transactions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center gap-4 border-b border-slate-700/60 pb-3">
          {['expense','income'].map(key => (
            <button
              key={key}
              className={`px-3 py-1 rounded-full text-sm font-semibold ${tab === key ? 'bg-accent text-white' : 'text-muted bg-panel2'}`}
              onClick={() => setTab(key)}
            >
              {key === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
        <div className="max-w-2xl">
          {tab === 'expense' && <ExpenseForm onAdd={handleAddExpense} />}
          {tab === 'income' && <IncomeForm onAdd={handleAddIncome} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(totalsByCat).map(([cat, amt]) => (
          <div className="card" key={cat}>
            <div className="label">{cat}</div>
            <div className="kpi">{formatCurrency(amt)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-2 font-semibold">Transaction History</div>
          <TransactionTable 
            transactions={[...transactions.incomes, ...transactions.expenses].sort((a,b)=>new Date(b.date)-new Date(a.date))} 
            onDelete={handleDeleteTransaction} 
            formatCurrency={formatCurrency} 
            onShowReceipt={setReceiptModal}
          />
        </div>
        <div className="card">
          <div className="mb-2 font-semibold">Recent Income</div>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {transactions.incomes.slice(0,10).map(inc => (
              <div key={inc.id} className="flex items-center justify-between border border-slate-800/60 rounded-xl px-3 py-2">
                <div>
                  {/* FIX 2: Use `inc.name` from the new schema */}
                  <div className="font-semibold">{inc.name}</div>
                  <div className="text-xs text-muted">{inc.date}</div>
                </div>
                <div className="text-sm font-bold">{formatCurrency(inc.amount)}</div>
              </div>
            ))}
            {transactions.incomes.length === 0 && <div className="text-sm text-muted">Add your first income entry to see it here.</div>}
          </div>
        </div>
      </div>
      
      {/* ... (Omitted Insights and Charts for brevity) ... */}

      <div className="card space-y-4">
        <div>
          <div className="text-lg font-semibold">Spending Insights</div>
          <p className="text-sm text-muted">AI-style highlights curated from your activity.</p>
        </div>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          {insights.map((text, idx) => (<li key={idx}>{text}</li>))}
        </ul>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="col-span-2 space-y-3">
            <div className="font-semibold">Daily Spend Trend</div>
            <div className="h-60">
              <ResponsiveContainer>
                <LineChart data={spendingByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" /><YAxis /><Tooltip />
                  <Line dataKey="total" stroke="#6366f1" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Category Radar</div>
            <div className="h-60">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={45} domain={[0, Math.max(...radarData.map(d => d.value), 50)]} />
                  <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div>
          <div className="font-semibold mb-2">Weekly Heatmap</div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th></th>
                  {slotLabels.map(slot => (<th key={slot} className="px-2 py-1 text-muted">{slot}</th>))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map(row => (
                  <tr key={row.day}>
                    <td className="font-semibold py-1">{row.day}</td>
                    {slotLabels.map(slot => {
                      const intensity = Math.min(1, row[slot] / (Math.max(...heatmap.map(r => Math.max(...slotLabels.map(s => r[s]))), 1)))
                      return (
                        <td key={slot} className="px-2 py-1">
                          <div className="h-6 rounded" style={{ backgroundColor:`rgba(99,102,241,${0.15 + intensity * 0.85})` }}></div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {receiptModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-panel border border-slate-700/60 rounded-2xl p-4 w-full max-w-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Receipt — {receiptModal.title}</div>
              <button className="btn btn-ghost text-sm" onClick={()=>setReceiptModal(null)}>Close</button>
            </div>
            {receiptModal.data.startsWith('data:image') ? (
              <img src={receiptModal.data} alt="Receipt" className="rounded-xl" />
            ) : (
              <iframe src={receiptModal.data} title="Receipt" className="w-full h-96 rounded-xl"></iframe>
            )}
          </div>
        </div>
      )}
    </div>
  )
}