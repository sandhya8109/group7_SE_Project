import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup(){
  const { signup } = useAuth()
  const [form, setForm] = useState({ email:'', password:'', confirm:'', remember: true })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if(form.password !== form.confirm){ setError('Passwords do not match'); return }
    try{
      await signup({ email: form.email, password: form.password, remember: form.remember })
    }catch(err){
      setError(err.message || 'Signup failed')
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="label">Email</label>
        <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
      </div>
      <div className="space-y-1">
        <label className="label">Password</label>
        <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
      </div>
      <div className="space-y-1">
        <label className="label">Confirm Password</label>
        <input className="input" type="password" placeholder="••••••••" value={form.confirm} onChange={e=>setForm({...form, confirm:e.target.value})}/>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={form.remember} onChange={e=>setForm({...form, remember:e.target.checked})} />
        Remember me
      </label>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button className="btn btn-primary w-full" type="submit">CREATE ACCOUNT</button>
      <p className="text-center text-sm text-muted">Already have an account? <Link to="/login" className="text-accent">Login</Link></p>
    </form>
  )
}
