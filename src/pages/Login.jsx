import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const { login } = useAuth()
  const [form, setForm] = useState({ email:'', password:'', remember: true })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try{
      await login(form)
    }catch(err){
      setError(err.message || 'Login failed')
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
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={form.remember} onChange={e=>setForm({...form, remember:e.target.checked})} />
          Remember me
        </label>
        <Link to="/forgot" className="text-sm text-accent">Forgot?</Link>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <button className="btn btn-primary w-full" type="submit">LOGIN</button>
      <p className="text-center text-sm text-muted">No account? <Link to="/signup" className="text-accent">Create one</Link></p>
    </form>
  )
}
