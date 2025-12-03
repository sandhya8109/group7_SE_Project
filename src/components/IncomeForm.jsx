import React, { useState } from 'react'

const defaultForm = () => ({
  date: new Date().toISOString().slice(0,10),
  source: '', 
  amount: '',
  notes: '' 
})

export default function IncomeForm({ onAdd, userId }){ 
  const [form, setForm] = useState(defaultForm())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    // The name and amount are required fields
    if(!form.source || !form.amount) return
    
    setIsSubmitting(true)
    try {
      // --- START: MAPPING FORM DATA TO DB SCHEMA FIELDS ---
      const transactionData = {
        // Required fields:
        user_id: userId , 
        type: 'income',           
        amount: Number(form.amount), 
        date: form.date,          
        
        // Mapped fields:
        name: form.source,        
        description: form.notes,  

        // Optional/Defaulted fields:
        category: 'Salary',       
        receipt_data: null        
      }
      
      await onAdd(transactionData)
      // --- END: MAPPING FORM DATA TO DB SCHEMA FIELDS ---

      setForm(defaultForm())
    } catch (error) {
      console.error('Failed to add income:', error)
      // Optionally show an error message to the user here
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-4 gap-2">
        <input type="date" className="input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <input className="input" placeholder="Income source" value={form.source} onChange={e=>setForm({...form, source:e.target.value})} />
        <input type="number" step="0.01" className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        <input className="input" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Income'}
      </button>
    </form>
  )
}