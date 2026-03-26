// src/pages/Register.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const TIPOS = [
  { value: 'usuario', label: '👤 Usuário comum', desc: 'Quero desabafar e receber apoio' },
  { value: 'profissional', label: '🩺 Profissional', desc: 'Sou psicólogo/terapeuta e quero oferecer suporte' },
]

export default function Register() {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(1) // 1: tipo, 2: dados
  const [tipo, setTipo] = useState('usuario')
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmar: '',
    especialidade: '', descricao: '', crp: '',
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.senha !== form.confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    setErro('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(cred.user, { displayName: form.nome })

      // Salva perfil no Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        nome: form.nome,
        email: form.email,
        tipo,
        ...(tipo === 'profissional' && {
          especialidade: form.especialidade,
          descricao: form.descricao,
          crp: form.crp,
          avaliacoes: [],
          media: 0,
        }),
        criadoEm: serverTimestamp(),
      })

      navigate('/dashboard')
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/weak-password': 'Senha muito fraca.',
      }
      setErro(msgs[err.code] || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-3xl text-stone-900 hover:text-brand-600 transition-colors">
            SafeTalk
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Crie sua conta gratuita</p>
        </div>

        <div className="card p-8">
          {etapa === 1 ? (
            <>
              <h1 className="font-serif text-2xl text-stone-900 mb-2">Como você quer usar?</h1>
              <p className="text-stone-500 text-sm mb-6">Escolha seu perfil para personalizar a experiência.</p>
              <div className="space-y-3 mb-6">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      tipo === t.value
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-stone-800">{t.label}</div>
                    <div className="text-stone-500 text-xs mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setEtapa(2)} className="btn-primary w-full">
                Continuar →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="text-stone-400 hover:text-stone-600 text-sm mb-4 flex items-center gap-1"
              >
                ← Voltar
              </button>
              <h1 className="font-serif text-2xl text-stone-900 mb-6">Seus dados</h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome</label>
                  <input name="nome" value={form.nome} onChange={handleChange}
                    placeholder="Como quer ser chamado" className="input-field" required />
                </div>
                <div>
                  <label className="label">E-mail</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="seu@email.com" className="input-field" required autoComplete="email" />
                </div>

                {tipo === 'profissional' && (
                  <>
                    <div>
                      <label className="label">Especialidade</label>
                      <input name="especialidade" value={form.especialidade} onChange={handleChange}
                        placeholder="Ex: Psicólogo clínico" className="input-field" required />
                    </div>
                    <div>
                      <label className="label">CRP / Registro profissional</label>
                      <input name="crp" value={form.crp} onChange={handleChange}
                        placeholder="Ex: CRP 06/123456" className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Descrição breve</label>
                      <textarea name="descricao" value={form.descricao} onChange={handleChange}
                        placeholder="Conte um pouco sobre sua abordagem..." className="input-field" rows={3} />
                    </div>
                  </>
                )}

                <div>
                  <label className="label">Senha</label>
                  <input type="password" name="senha" value={form.senha} onChange={handleChange}
                    placeholder="Mínimo 6 caracteres" className="input-field" required autoComplete="new-password" />
                </div>
                <div>
                  <label className="label">Confirmar senha</label>
                  <input type="password" name="confirmar" value={form.confirmar} onChange={handleChange}
                    placeholder="Repita a senha" className="input-field" required autoComplete="new-password" />
                </div>

                {erro && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center flex items-center gap-2 mt-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Criando conta...
                    </>
                  ) : 'Criar conta'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-stone-500 text-sm mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
