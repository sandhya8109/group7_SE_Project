import React from 'react'

export default function TransactionTable({ transactions = [], onDelete, onShowReceipt, formatCurrency }){
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-4">
        No transactions yet. Add your first transaction above.
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[500px]">
      <table className="w-full text-sm">
        <thead className="text-left text-muted sticky top-0 bg-panel">
          <tr className="border-b border-slate-700/60">
            <th className="py-2">Type</th>
            <th>Date</th>
            <th>Time</th>
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
            const name = isIncome ? txn.source : txn.name
            const category = isIncome ? 'Income' : txn.category
            
            return (
              <tr key={id} className="border-b border-slate-800/60">
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isIncome ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isIncome ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td>{txn.date}</td>
                <td>{txn.time || '—'}</td>
                <td>{name || '—'}</td>
                <td>{category || '—'}</td>
                <td className={isIncome ? 'text-green-400' : 'text-red-400'}>
                  {isIncome ? '+' : '-'}{formatCurrency ? formatCurrency(txn.amount) : `$${Number(txn.amount).toFixed(2)}`}
                </td>
                <td className="max-w-[150px] truncate" title={txn.notes}>
                  {txn.notes || '—'}
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