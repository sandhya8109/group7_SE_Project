import React from 'react'

// Helper to format date to YYYY-MM-DD
const formatDate = (dateValue) => {
  if (!dateValue) return '—'
  const dateStr = dateValue.toString()
  
  // If already in YYYY-MM-DD format, return as is (useful for DB dates)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  // Parse and format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TransactionTable({ transactions = [], onDelete, onShowReceipt, formatCurrency }){
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-4">
        No transactions yet. Add your first transaction above.
      </div>
    )
  }

  console.log('[DEBUG] TransactionTable - Sample transaction:', transactions[0]) // Debug

  return (
    <div className="overflow-auto max-h-[500px]">
      <table className="w-full text-sm">
        <thead className="text-left text-muted sticky top-0 bg-panel">
          <tr className="border-b border-slate-700/60">
            <th className="py-2">Type</th>
            <th>Date</th>
            {/* REMOVED: <th>Time</th> */} 
            <th>Name</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Notes</th>
            <th>Receipt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => {
            const id = txn.transaction_id || txn.id
            const isIncome = txn.type?.toLowerCase() === 'income'
            
            // --- LOGIC TO FIT NEW SCHEMA ---
            const name = txn.name || 'Untitled Transaction' 
            const notes = txn.description || '' 
            const category = isIncome ? 'Income' : (txn.category || '—')
            // --- END LOGIC ---
            
            return (
              <tr key={id} className="border-b border-slate-800/60">
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isIncome ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isIncome ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td>{formatDate(txn.date)}</td>
                {/* REMOVED: <td>{txn.time || '—'}</td> */} 
                <td className="max-w-[150px] truncate" title={name}>{name}</td>
                <td>{category}</td>
                <td className={isIncome ? 'text-green-400' : 'text-red-400'}>
                  {isIncome ? '+' : '-'}{formatCurrency ? formatCurrency(txn.amount) : `${Number(txn.amount).toFixed(2)}`}
                </td>
                <td className="max-w-[150px] truncate" title={notes}>
                  {notes || '—'}
                </td>
                <td>
                  {txn.receipt_data ? (
                    <button 
                      className="btn btn-ghost text-xs" 
                      onClick={() => onShowReceipt?.({ data: txn.receipt_data, title: name })}
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="text-right">
                  <button 
                    className="btn btn-ghost text-xs text-red-400" 
                    onClick={() => onDelete?.(id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}