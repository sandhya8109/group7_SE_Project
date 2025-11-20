import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import { AuthProvider } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'

import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Budgets from './pages/Budgets'
import Goals from './pages/Goals'
import Reminders from './pages/Reminders'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Forgot from './pages/Forgot'

export default function App(){
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<AuthLayout title="Login"><Login/></AuthLayout>} />
              <Route path="/signup" element={<AuthLayout title="Create Account"><Signup/></AuthLayout>} />
              <Route path="/forgot" element={<AuthLayout title="Forgot Password"><Forgot/></AuthLayout>} />

              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard/>} />
                      <Route path="/expenses" element={<Expenses/>} />
                      <Route path="/budgets" element={<Budgets/>} />
                      <Route path="/goals" element={<Goals/>} />
                      <Route path="/reminders" element={<Reminders/>} />
                      <Route path="/reports" element={<Reports/>} />
                      <Route path="/settings" element={<Settings/>} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }/>
            </Routes>
          </NotificationProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
