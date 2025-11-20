import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi, signupApi, meApi } from '../api/auth'

const AuthCtx = createContext()
const SESSION_KEY = 'pfbms-session' // {token,user}
const PROFILE_KEY = 'pfbms-profile-v1'

export function AuthProvider({ children }){
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(PROFILE_KEY)
    return saved ? JSON.parse(saved) : { name: 'Finance Pro', email: '', avatar: '' }
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    if (saved) {
      const s = JSON.parse(saved)
      setSession(s)
      setProfile(p => ({ ...p, email: s.user?.email || p.email || '' }))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [profile])

  const login = async ({ email, password, remember }) => {
    const res = await loginApi({ email, password })
    const s = { token: res.token, user: res.user }
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
    setProfile(p => ({ ...p, email: res.user?.email || p.email || '' }))
    navigate('/')
  }

  const signup = async ({ email, password, remember }) => {
    const res = await signupApi({ email, password })
    const s = { token: res.token, user: res.user }
    if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
    setProfile(p => ({ ...p, email: res.user?.email || p.email || '' }))
    navigate('/')
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
    navigate('/login')
  }

  const updateProfile = ({ name, email, avatar }) => {
    setProfile(prev => ({
      ...prev,
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(avatar !== undefined ? { avatar } : {})
    }))
    setSession(prev => prev ? ({ ...prev, user: { ...prev.user, name: name ?? prev.user?.name, email: email ?? prev.user?.email } }) : prev)
  }

  const value = { session, user: session?.user, token: session?.token, profile, updateProfile, login, signup, logout, loading }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
