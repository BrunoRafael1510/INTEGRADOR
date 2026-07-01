import { signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../services/firebase'
import Icon from './Icon'

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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur border-b border-stone-200 flex items-center px-4 gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
        aria-label="Abrir menu"
      >
        <Icon name="menu" className="w-5 h-5" />
      </button>

      <span className="font-serif text-xl text-stone-900 flex-1">SafeTalk</span>

      <span className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200">
        <Icon name="alert" className="w-3.5 h-3.5" />
        Nao substitui acompanhamento profissional
      </span>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center">
          {iniciais}
        </div>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-stone-700 p-2 rounded-lg hover:bg-stone-100 transition-colors"
          title="Sair"
          aria-label="Sair"
        >
          <Icon name="logout" className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
