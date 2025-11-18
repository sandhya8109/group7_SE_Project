import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'

export default function Settings(){
  const { profile, updateProfile } = useAuth()
  const { state, setState, currencyMap } = useFinance()
  const [form, setForm] = useState({ name: profile?.name || '', email: profile?.email || '', avatar: profile?.avatar || '', currency: state.currency })
  const [status, setStatus] = useState('')

  const onImageChange = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar: reader.result }))
    reader.readAsDataURL(file)
  }

  const save = (e) => {
    e.preventDefault()
    updateProfile({ name: form.name, email: form.email, avatar: form.avatar })
    setState(s => ({ ...s, currency: form.currency }))
    setStatus('Preferences updated successfully ✅')
    setTimeout(() => setStatus(''), 3000)
  }

  const reset = () => { if(confirm('Reset local demo data?')){ localStorage.removeItem('pfbms-state-v1'); location.reload() } }

  return (
    <div className="space-y-4">
      <form className="card space-y-4" onSubmit={save}>
        <div>
          <div className="text-lg font-semibold">Profile & Preferences</div>
          <p className="text-sm text-muted">Keep your profile information and currency preference up to date.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="space-y-3">
            <div className="label">Profile Picture</div>
            <div className="flex flex-col items-center gap-3">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="w-32 h-32 rounded-full object-cover border border-slate-700/60" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-panel2 flex items-center justify-center text-3xl">👤</div>
              )}
              <label className="btn btn-ghost text-sm cursor-pointer">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => onImageChange(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="label">Full Name</div>
              <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Alex Doe" />
            </div>
            <div>
              <div className="label">Email</div>
              <input className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@email.com" />
            </div>
            <div>
              <div className="label">Currency</div>
              <select className="input" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                {Object.entries(currencyMap).map(([code, meta]) => (
                  <option value={code} key={code}>{code} — {meta.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
            {status && <div className="text-xs text-green-400">{status}</div>}
          </div>
        </div>
      </form>
      <div className="card">
        <div className="mb-2 font-semibold">Data</div>
        <button className="btn btn-ghost" onClick={reset}>Reset Demo Data</button>
      </div>
    </div>
  )
}
