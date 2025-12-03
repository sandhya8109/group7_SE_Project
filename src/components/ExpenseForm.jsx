import React, { useState } from 'react'

const defaultForm = () => ({
  date: new Date().toISOString().slice(0,10),
  time: new Date().toTimeString().slice(0,5),
  name:'',
  category:'Food',
  amount:'',
  notes:'',
  receipt:null,
  receiptName:''
})

export default function ExpenseForm({ onAdd }){
  const [form, setForm] = useState(defaultForm())
  const [preview, setPreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if(!form.name || !form.amount) return
    
    setIsSubmitting(true)
    try {
      await onAdd({ ...form })
      setForm(defaultForm())
      setPreview('')
    } catch (error) {
      console.error('Failed to add expense:', error)
      // Optionally show an error message to the user here
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceipt = (file) => {
    if(!file){
      setForm(f => ({ ...f, receipt: null, receiptName: '' }))
      setPreview('')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm(f => ({ ...f, receipt: reader.result, receiptName: file.name }))
      if(file.type.startsWith('image/')){
        setPreview(reader.result)
      } else {
        setPreview('')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-6 gap-2">
        <input type="date" className="input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        <input type="time" className="input" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
        <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <select className="input" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
          <option>Food</option><option>Transport</option><option>Utilities</option><option>Entertainment</option><option>Shopping</option><option>Other</option>
        </select>
        <input type="number" step="0.01" className="input" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} />
        <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="btn btn-ghost cursor-pointer">
          Upload receipt
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>handleReceipt(e.target.files[0])} />
        </label>
        {form.receiptName && <span className="text-xs text-muted">{form.receiptName}</span>}
        {preview && <img src={preview} alt="Receipt preview" className="h-16 rounded-lg border border-slate-700/60" />}
      </div>
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
}