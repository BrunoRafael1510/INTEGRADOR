import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import Icon from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'

export default function Login({ theme = 'light', onThemeToggle }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      await signInWithEmailAndPassword(auth, form.email, form.senha)
      navigate('/dashboard')
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'Usuario nao encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail invalido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
      }
      setErro(msgs[err.code] || 'Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-bg login-page min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle theme={theme} onThemeToggle={onThemeToggle} />
      </div>
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="font-sans text-3xl font-bold text-stone-900 hover:text-brand-700 transition-colors duration-150">
            SafeTalk
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Entre para continuar seu espaco de apoio.</p>
        </div>

        <div className="card login-card p-8">
          <div className="login-lock w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mb-5">
            <Icon name="lock" className="w-5 h-5" />
          </div>
          <h1 className="font-sans text-2xl font-bold text-stone-900 mb-6">Entrar</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 text-sm mt-6">
          Nao tem conta?{' '}
          <Link to="/cadastro" className="text-brand-600 font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
