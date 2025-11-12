import React from 'react'
import { useFinance } from '../context/FinanceContext'

export default function Settings(){
  const { state, setState } = useFinance()
  const reset = () => { if(confirm('Reset local demo data?')){ localStorage.removeItem('pfbms-state-v1'); location.reload() } }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-2 font-semibold">Preferences</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <div>
            <div className="label">Currency</div>
            <select className="input" value={state.currency} onChange={e=>setState(s=>({...s,currency:e.target.value}))}>
              <option>USD</option><option>EUR</option><option>NPR</option><option>INR</option>
            </select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="mb-2 font-semibold">Data</div>
        <button className="btn btn-ghost" onClick={reset}>Reset Demo Data</button>
      </div>
    </div>
  )
}
