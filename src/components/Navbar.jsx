// src/components/Navbar.jsx
import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'

export default function Navbar({ user, onMenuToggle }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const iniciais = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-stone-100 flex items-center px-4 gap-4">
      {/* Botão menu mobile */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
        aria-label="Abrir menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <span className="font-serif text-xl text-stone-900 flex-1">SafeTalk</span>

      {/* Aviso */}
      <span className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
        <span>⚠️</span> Não substitui acompanhamento profissional
      </span>

      {/* Avatar + logout */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-semibold text-xs flex items-center justify-center">
          {iniciais}
        </div>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-colors"
          title="Sair"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
