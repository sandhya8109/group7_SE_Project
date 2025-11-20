import React from 'react'

export default function TransactionTable({ rows = [], onDelete, onViewReceipt, formatAmount }){
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted">
          <tr className="border-b border-slate-700/60">
            <th className="py-2">Date</th><th>Time</th><th>Name</th><th>Category</th><th>Amount</th><th>Notes</th><th>Receipt</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b border-slate-800/60">
              <td className="py-2">{r.date}</td>
              <td>{r.time || '--'}</td>
              <td>{r.name}</td>
              <td>{r.category}</td>
              <td>{formatAmount ? formatAmount(r.amount) : `$${Number(r.amount).toFixed(2)}`}</td>
              <td>{r.notes}</td>
              <td>
                {r.receipt ? (
                  <button className="btn btn-ghost text-xs" onClick={()=>onViewReceipt?.(r.receipt, r.name)}>View</button>
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </td>
              <td className="text-right"><button className="btn btn-ghost" onClick={()=>onDelete?.(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
