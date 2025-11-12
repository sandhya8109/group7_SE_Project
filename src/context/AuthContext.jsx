import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi, signupApi, meApi } from '../api/auth'

const AuthCtx = createContext()
const SESSION_KEY = 'pfbms-session' // {token,user}

export function AuthProvider({ children }){
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      setSession(s)
    }
    setLoading(false)
  }, [])

  const login = async ({ email, password, remember }) => {
    const res = await loginApi({ email, password })
    const s = { token: res.token, user: res.user }
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
    navigate('/')
  }

  const signup = async ({ email, password, remember }) => {
    const res = await signupApi({ email, password })
    const s = { token: res.token, user: res.user }
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    navigate('/login')
  }

  const value = { session, user: session?.user, token: session?.token, login, signup, logout, loading }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
