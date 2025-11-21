import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

const ThemeCtx = createContext()
const STORAGE_KEY = 'pfbms-theme'

const getPreferredTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const applyTheme = (mode) => {
  const root = document.documentElement
  const body = document.body
  const isDark = mode === 'dark'
  root.classList.toggle('dark', isDark)
  body.classList.toggle('theme-light', !isDark)
  body.classList.toggle('theme-dark', isDark)
  body.dataset.theme = mode
}

export function ThemeProvider({ children }){
  const [theme, setTheme] = useState(getPreferredTheme)

  useLayoutEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setDark = useCallback(() => setTheme('dark'), [])
  const setLight = useCallback(() => setTheme('light'), [])
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, setDark, setLight }),
    [theme, toggleTheme, setDark, setLight]
  )

  return (
    <ThemeCtx.Provider value={value}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
