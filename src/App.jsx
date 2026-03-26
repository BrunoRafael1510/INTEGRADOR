// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

// Rota protegida: redireciona para /login se não autenticado
function PrivateRoute({ user, children }) {
  if (user === undefined) {
    // ainda carregando estado de auth
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
  const [user, setUser] = useState(undefined) // undefined = carregando

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null)
    })
    return unsubscribe
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing user={user} />} />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/cadastro" element={
          user ? <Navigate to="/dashboard" replace /> : <Register />
        } />

        {/* Privadas — o Dashboard gerencia sub-rotas via prop `page` */}
        <Route path="/dashboard/*" element={
          <PrivateRoute user={user}>
            <Dashboard user={user} />
          </PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
