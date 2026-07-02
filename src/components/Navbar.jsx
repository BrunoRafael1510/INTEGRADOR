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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 flex items-center px-4 gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-brand-50 text-stone-500 transition-colors duration-150"
        aria-label="Abrir menu"
      >
        <Icon name="menu" className="w-5 h-5" />
      </button>

      <span className="font-sans text-xl font-bold text-stone-900 flex-1">SafeTalk</span>

      <span className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-100/70 px-3 py-1.5 rounded-full border border-stone-200">
        <Icon name="alert" className="w-3.5 h-3.5" />
        Nao substitui acompanhamento profissional
      </span>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-600 border border-brand-700/10 text-stone-50 font-medium text-xs flex items-center justify-center">
          {iniciais}
        </div>
        <button
          onClick={handleLogout}
          className="text-stone-400 hover:text-brand-700 p-2 rounded-lg hover:bg-brand-50 transition-colors duration-150"
          title="Sair"
          aria-label="Sair"
        >
          <Icon name="logout" className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
