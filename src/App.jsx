import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function PrivateRoute({ user, children }) {
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-stone-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [theme, setTheme] = useState(() => localStorage.getItem('safetalk-theme') || 'light')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('safetalk-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((current) => current === 'dark' ? 'light' : 'dark')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing user={user} theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login theme={theme} onThemeToggle={toggleTheme} />
        } />
        <Route path="/cadastro" element={
          user ? <Navigate to="/dashboard" replace /> : <Register theme={theme} onThemeToggle={toggleTheme} />
        } />

        <Route path="/dashboard/*" element={
          <PrivateRoute user={user}>
            <Dashboard user={user} theme={theme} onThemeToggle={toggleTheme} />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
