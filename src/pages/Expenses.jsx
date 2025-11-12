import React, { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import ExpenseForm from '../components/ExpenseForm'
import TransactionTable from '../components/TransactionTable'

export default function Expenses(){
  const { state, addExpense, removeExpense } = useFinance()
  const totalsByCat = useMemo(() => {
    const map = {}; for(const e of state.expenses){ map[e.category]=(map[e.category]||0)+Number(e.amount) } return map
  }, [state.expenses])
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 font-semibold">Add Expense</div>
        <ExpenseForm onAdd={addExpense} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(totalsByCat).map(([cat, amt]) => (
          <div className="card" key={cat}>
            <div className="label">{cat}</div>
            <div className="kpi">${amt.toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="mb-3 font-semibold">All Expenses</div>
        <TransactionTable rows={state.expenses} onDelete={removeExpense} />
      </div>
    </div>
  )
}
