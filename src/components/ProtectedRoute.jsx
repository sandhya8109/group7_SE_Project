import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }){
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}
