import React, { useState, useEffect, useCallback } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { 
  fetchReminders, createReminder, updateReminder, deleteReminder 
} from '../api/client'
import { Pencil, Trash2, X } from 'lucide-react'

function ReminderCard({ reminder, formatCurrency, onEdit, onDelete }){
  const daysLeft = Math.ceil((new Date(reminder.dueDate) - new Date())/(1000*60*60*24)) 
  const status = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : daysLeft <= 3 ? 'Due soon' : ''
  const chip = status && (
    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${daysLeft < 0 ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
      {status}
    </span>
  )
  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <div className="font-semibold truncate" title={reminder.title}>{reminder.title}</div>
        {chip}
        <div className="ml-auto flex items-center gap-2 text-sm text-muted">
          <span>{reminder.recurring}</span>
          <button className="p-1 rounded hover:bg-panel2" onClick={onEdit} aria-label="Edit reminder">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-panel2" onClick={onDelete} aria-label="Delete reminder">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      <div className="mt-1 text-2xl font-extrabold">{formatCurrency(reminder.amount)}</div>
      <div className="text-sm text-muted">Due {reminder.dueDate} • {daysLeft >= 0 ? `${daysLeft} day(s) left` : `Overdue by ${-daysLeft} day(s)`}</div>
      {reminder.category && <div className="text-xs text-muted">Category: {reminder.category}</div>}
      {reminder.description && <div className="text-xs text-muted">{reminder.description}</div>}
    </div>
  )
}

export default function Reminders(){
  const { formatCurrency } = useFinance()
  const { user, token } = useAuth()
  
  // Helper to normalize date to YYYY-MM-DD format
  const normalizeDate = (dateValue) => {
    if (!dateValue) return ''
    // Handle various date formats
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '' // Invalid date
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const initialForm = { 
    title: '', 
    amount: '', 
    dueDate: new Date().toISOString().split('T')[0], 
    recurring: 'Monthly', 
    category: '', 
    description: '' 
  }
  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(null)
  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // --- Data Fetching Function (READ operation) ---
  const fetchRemindersData = useCallback(async () => {
    if (!user || !user.user_id) return;
    setIsLoading(true);
    try {
        const data = await fetchReminders(user.user_id, token);
        setReminders(data);
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
    } finally {
        setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchRemindersData();
  }, [fetchRemindersData]);

  // --- CRUD Handlers ---

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    console.log('[DEBUG] Form submit triggered', { editing, form }); // Debug
    
    if (!form.title || !form.amount || !form.dueDate) {
      console.log('[DEBUG] Form validation failed'); // Debug
      return
    }

    console.log('[DEBUG] Submitting reminder, editing ID:', editing); // Debug

    try {
        if (editing) {
            // UPDATE operation - backend expects dueDate (camelCase)
            const updateData = {
              title: form.title,
              amount: Number(form.amount),
              dueDate: form.dueDate,
              recurring: form.recurring,
              category: form.category || '',
              description: form.description || '',
              user_id: user.user_id
            }
            console.log('[DEBUG] Calling updateReminder with ID:', editing, 'data:', updateData); // Debug
            await updateReminder(editing, updateData, token);
            console.log('[DEBUG] Update successful'); // Debug
        } else {
            // CREATE operation - backend expects dueDate (camelCase)
            const createData = {
              title: form.title,
              amount: Number(form.amount),
              dueDate: form.dueDate,
              recurring: form.recurring,
              category: form.category || '',
              description: form.description || '',
              user_id: user.user_id
            }
            console.log('[DEBUG] Calling createReminder with data:', createData); // Debug
            await createReminder(createData, token);
            console.log('[DEBUG] Create successful'); // Debug
        }
        
        setForm(initialForm)
        setEditing(null)
        await fetchRemindersData()
    } catch (error) {
        console.error(`Failed to ${editing ? 'update' : 'create'} reminder:`, error);
    }
  }

  const handleEdit = (reminder) => {
    console.log('[DEBUG] Editing reminder:', reminder); // Debug
    const normalizedDate = normalizeDate(reminder.dueDate)
    console.log('[DEBUG] Normalized dueDate:', normalizedDate); // Debug
    setForm({
      title: reminder.title,
      amount: reminder.amount,
      dueDate: normalizedDate,
      recurring: reminder.recurring,
      category: reminder.category || '',
      description: reminder.description || ''
    })
    const editId = reminder.id || reminder.reminder_id
    console.log('[DEBUG] Setting editing ID to:', editId); // Debug
    setEditing(editId)
  }

  const handleDelete = async (reminderId) => {
    try {
        await deleteReminder(reminderId, user.user_id, token);
        await fetchRemindersData();
    } catch (error) {
        console.error("Failed to delete reminder:", error);
    }
  }

  const handleCancelEdit = () => {
    setEditing(null)
    setForm(initialForm)
  }
  
  if (isLoading) {
    return <div className="p-8 text-center text-xl text-muted">Loading Reminders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between font-semibold">
          <span>{editing ? 'Edit Reminder' : 'Add Reminder'}</span>
          {editing && (
            <button 
              className="text-xs text-muted inline-flex items-center gap-1" 
              onClick={handleCancelEdit}
              type="button"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
        </div>
        <form onSubmit={handleFormSubmit} className="grid gap-2 md:grid-cols-6">
          <input 
            className="input" 
            placeholder="Title" 
            value={form.title} 
            onChange={e=>setForm({...form, title:e.target.value})} 
            required
          />
          <input 
            className="input" 
            placeholder="Category" 
            value={form.category} 
            onChange={e=>setForm({...form, category:e.target.value})} 
          />
          <input 
            className="input md:col-span-2" 
            placeholder="Description" 
            value={form.description} 
            onChange={e=>setForm({...form, description:e.target.value})} 
          />
          <input 
            className="input" 
            type="number" 
            step="0.01" 
            placeholder="Amount" 
            value={form.amount} 
            onChange={e=>setForm({...form, amount:e.target.value})} 
            required
          />
          <input 
            className="input" 
            type="date" 
            value={form.dueDate} 
            onChange={e=>setForm({...form, dueDate:e.target.value})} 
            required
          />
          <select 
            className="input" 
            value={form.recurring} 
            onChange={e=>setForm({...form, recurring:e.target.value})}
          >
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Yearly</option>
            <option>One-time</option>
          </select>
          <button className="btn btn-primary md:col-span-6" type="submit">
            {editing ? 'Save Changes' : 'Add Reminder'}
          </button>
        </form>
      </div>
      {reminders.length === 0 ? (
        <div className="card bg-panel2 text-sm text-muted">No reminders yet. Add one above to start tracking due dates.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reminders.map(r => (
            <ReminderCard
              key={r.id || r.reminder_id}
              reminder={r}
              formatCurrency={formatCurrency}
              onEdit={() => handleEdit(r)}
              onDelete={() => handleDelete(r.id || r.reminder_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}