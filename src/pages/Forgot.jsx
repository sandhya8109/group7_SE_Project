import React, { useState } from 'react'
export default function Forgot(){
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const submit = (e)=>{ e.preventDefault(); setSent(true) }
  return (
    <form onSubmit={submit} className="space-y-4">
      {!sent ? (<>
        <div className="space-y-1">
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full">Send reset link</button>
      </>) : (<div className="text-sm text-muted">If this were connected to a backend, a password reset link would be emailed to <span className="text-text">{email}</span>.</div>)}
    </form>
  )
}
