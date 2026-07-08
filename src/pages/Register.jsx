import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import Icon from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'

const TIPOS = [
  {
    value: 'usuario',
    title: 'Quero receber apoio',
    desc: 'Participar do feed anonimo, compartilhar desabafos e responder outras pessoas.',
    icon: 'message',
  },
  {
    value: 'profissional',
    title: 'Sou profissional',
    desc: 'Criar um perfil no diretorio para ser encontrado por pessoas que buscam suporte.',
    icon: 'shield',
  },
]

const AREAS = [
  'Psicologia clinica',
  'Ansiedade e estresse',
  'Relacionamentos',
  'Terapia familiar',
  'Luto',
  'Autoestima',
  'Adolescencia',
  'Orientacao profissional',
  'Outro',
]

const ATENDIMENTOS = ['Online', 'Presencial', 'Online e presencial']

export default function Register({ theme = 'light', onThemeToggle }) {
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(1)
  const [tipo, setTipo] = useState('usuario')
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmar: '',
    especialidade: '',
    crp: '',
    descricao: '',
    abordagem: '',
    atendimento: 'Online',
    disponibilidade: '',
    areas: [],
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  const toggleArea = (area) => {
    setForm((current) => ({
      ...current,
      areas: current.areas.includes(area)
        ? current.areas.filter((item) => item !== area)
        : [...current.areas, area],
    }))
    setErro('')
  }

  const validate = () => {
    if (form.senha !== form.confirmar) return 'As senhas nao coincidem.'
    if (form.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
    if (tipo === 'profissional' && form.areas.length === 0) {
      return 'Selecione pelo menos uma area de atuacao.'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setErro(validationError)
      return
    }

    setLoading(true)
    setErro('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(cred.user, { displayName: form.nome })

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        nome: form.nome,
        email: form.email,
        tipo,
        ...(tipo === 'profissional' && {
          especialidade: form.especialidade || form.areas[0],
          areas: form.areas,
          descricao: form.descricao,
          crp: form.crp,
          abordagem: form.abordagem,
          atendimento: form.atendimento,
          disponibilidade: form.disponibilidade,
          avaliacoes: [],
          media: 0,
        }),
        criadoEm: serverTimestamp(),
      })

      navigate('/dashboard')
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Este e-mail ja esta cadastrado.',
        'auth/invalid-email': 'E-mail invalido.',
        'auth/weak-password': 'Senha muito fraca.',
      }
      setErro(msgs[err.code] || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle theme={theme} onThemeToggle={onThemeToggle} />
      </div>
      <div className="w-full max-w-3xl animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="font-sans text-3xl font-bold text-stone-900 hover:text-brand-700 transition-colors duration-150">
            SafeTalk
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Crie sua conta e escolha como quer usar o espaco.</p>
        </div>

        <div className="card overflow-hidden">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <aside className="bg-brand-800 text-stone-50 p-8 flex flex-col justify-between gap-8">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-100 bg-stone-50/10 border border-stone-50/20 px-3 py-1.5 rounded-full">
                  <Icon name="shield" className="w-3.5 h-3.5" />
                  Perfil seguro
                </span>
                <h1 className="font-serif text-3xl mt-6 mb-3">
                  Um cadastro para cada tipo de jornada.
                </h1>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Clientes entram em um ambiente anonimo de acolhimento. Profissionais ganham campos especificos para aparecer melhor no diretorio.
                </p>
              </div>
              <div className="space-y-3 text-sm text-stone-300">
                <p className="flex items-center gap-2"><Icon name="check" className="w-4 h-4 text-sage-300" /> Sem exposicao publica de dados sensiveis.</p>
                <p className="flex items-center gap-2"><Icon name="check" className="w-4 h-4 text-sage-300" /> Perfil profissional com areas e registro.</p>
              </div>
            </aside>

            <section className="p-6 md:p-8">
              {etapa === 1 ? (
                <>
                  <h2 className="font-sans text-2xl font-bold text-stone-900 mb-2">Como voce quer entrar?</h2>
                  <p className="text-stone-500 text-sm mb-6">Essa escolha muda os campos do cadastro e a experiencia dentro do app.</p>

                  <div className="grid gap-3 mb-6">
                    {TIPOS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTipo(t.value)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors duration-150 ${
                          tipo === t.value
                            ? 'border-brand-300 bg-brand-50'
                            : 'border-stone-200 hover:border-brand-200 bg-stone-50/80'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tipo === t.value ? 'bg-brand-600 text-stone-50' : 'bg-stone-100 text-stone-500'
                          }`}>
                            <Icon name={t.icon} className="w-5 h-5" />
                          </span>
                          <span>
                            <span className="block font-medium text-stone-800">{t.title}</span>
                            <span className="block text-stone-500 text-xs mt-1 leading-relaxed">{t.desc}</span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setEtapa(2)} className="btn-primary w-full">
                    Continuar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setEtapa(1)}
                    className="text-stone-400 hover:text-stone-600 text-sm mb-4"
                  >
                    Voltar
                  </button>
                  <h2 className="font-sans text-2xl font-bold text-stone-900 mb-6">
                    {tipo === 'profissional' ? 'Dados profissionais' : 'Seus dados'}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
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
                    </div>

                    {tipo === 'profissional' && (
                      <>
                        <div>
                          <label className="label">Areas de atuacao</label>
                          <div className="flex flex-wrap gap-2">
                            {AREAS.map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => toggleArea(area)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                                  form.areas.includes(area)
                                    ? 'bg-brand-600 text-stone-50 border-brand-600'
                                    : 'bg-stone-50/80 text-stone-600 border-stone-200 hover:border-brand-300'
                                }`}
                              >
                                {area}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Especialidade principal</label>
                            <input name="especialidade" value={form.especialidade} onChange={handleChange}
                              placeholder="Ex: Psicologia clinica" className="input-field" />
                          </div>
                          <div>
                            <label className="label">CRP / Registro profissional</label>
                            <input name="crp" value={form.crp} onChange={handleChange}
                              placeholder="Ex: CRP 06/123456" className="input-field" required />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="label">Tipo de atendimento</label>
                            <select name="atendimento" value={form.atendimento} onChange={handleChange} className="input-field">
                              {ATENDIMENTOS.map((item) => <option key={item}>{item}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Disponibilidade</label>
                            <input name="disponibilidade" value={form.disponibilidade} onChange={handleChange}
                              placeholder="Ex: Noites e sabados" className="input-field" />
                          </div>
                        </div>

                        <div>
                          <label className="label">Abordagem</label>
                          <input name="abordagem" value={form.abordagem} onChange={handleChange}
                            placeholder="Ex: TCC, psicanalise, humanista" className="input-field" />
                        </div>

                        <div>
                          <label className="label">Descricao breve</label>
                          <textarea name="descricao" value={form.descricao} onChange={handleChange}
                            placeholder="Conte como voce costuma acolher e conduzir seus atendimentos." className="input-field" rows={3} />
                        </div>
                      </>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Senha</label>
                        <input type="password" name="senha" value={form.senha} onChange={handleChange}
                          placeholder="Minimo 6 caracteres" className="input-field" required autoComplete="new-password" />
                      </div>
                      <div>
                        <label className="label">Confirmar senha</label>
                        <input type="password" name="confirmar" value={form.confirmar} onChange={handleChange}
                          placeholder="Repita a senha" className="input-field" required autoComplete="new-password" />
                      </div>
                    </div>

                    {erro && (
                      <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
                        {erro}
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="btn-primary w-full gap-2 mt-2">
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
            </section>
          </div>
        </div>

        <p className="text-center text-stone-500 text-sm mt-6">
          Ja tem conta?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
