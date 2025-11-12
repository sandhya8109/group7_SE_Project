import React from 'react'

export default function AuthLayout({ title, children }){
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-muted mt-1">Welcome to your personal finance hub</p>
        </div>
        <div className="card">
          {children}
        </div>
        <p className="text-center text-xs text-muted mt-3">© {new Date().getFullYear()} PFBMS</p>
      </div>
    </div>
  )
}
