import React, { useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

export default function Reports(){
  const { state } = useFinance()
  const data = useMemo(()=>{
    const m = {}; for(const e of state.expenses){ m[e.category]=(m[e.category]||0)+Number(e.amount) } 
    return Object.entries(m).map(([category,total])=>({ category,total }))
  }, [state.expenses])
  return (
    <div className="card">
      <div className="mb-3 font-semibold">Spending by Category</div>
      <div className="h-96">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" /><YAxis /><Tooltip />
            <Bar dataKey="total" name="Amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
