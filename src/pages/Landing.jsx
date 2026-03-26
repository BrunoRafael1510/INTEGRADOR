// src/pages/Landing.jsx
import { useNavigate } from 'react-router-dom'

const features = [
  {
    icon: '🔒',
    title: 'Anonimato Total',
    desc: 'Seus desabafos são publicados sem identificação. Você escolhe o quanto compartilha.',
  },
  {
    icon: '💬',
    title: 'Apoio Real',
    desc: 'Receba respostas de pessoas que passaram por situações parecidas. Sem julgamentos.',
  },
  {
    icon: '🩺',
    title: 'Profissionais',
    desc: 'Quando estiver pronto, conecte-se com psicólogos e terapeutas verificados.',
  },
  {
    icon: '🤖',
    title: 'IA Acolhedora',
    desc: 'Nossa IA ajuda a reformular respostas para que sejam mais empáticas e gentis.',
  },
]

const categories = [
  'Ansiedade', 'Família', 'Relacionamentos', 'Trabalho',
  'Solidão', 'Luto', 'Autoestima', 'Outros',
]

export default function Landing({ user }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-2xl text-stone-900">SafeTalk</span>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary">
                Ir para o app
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-ghost">
                  Entrar
                </button>
                <button onClick={() => navigate('/cadastro')} className="btn-primary">
                  Começar agora
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          {/* Aviso discreto */}
          <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
            Um espaço seguro para se expressar
          </span>

          <h1 className="text-5xl md:text-6xl text-stone-900 leading-tight mb-6">
            Você não precisa
            <br />
            <em className="text-brand-500 not-italic">carregar isso</em> sozinho.
          </h1>

          <p className="text-lg text-stone-500 max-w-xl mx-auto mb-10 leading-relaxed">
            O SafeTalk é um ambiente anônimo e sem julgamentos para desabafar, receber apoio e, quando quiser, se conectar com profissionais de saúde mental.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/cadastro')}
              className="btn-primary text-base px-8 py-3"
            >
              Criar conta grátis
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-base px-8 py-3"
            >
              Já tenho conta
            </button>
          </div>

          <p className="mt-6 text-xs text-stone-400">
            ⚠️ O SafeTalk não substitui acompanhamento psicológico ou psiquiátrico profissional.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-6 bg-white border-y border-stone-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-stone-900 text-center mb-12">
            Feito para quem precisa ser ouvido
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-card transition-shadow duration-300">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-sans font-semibold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-stone-900 mb-4">
            Explore por categoria
          </h2>
          <p className="text-stone-500 mb-10">
            Encontre pessoas que entendem o que você está passando.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate('/cadastro')}
                className="px-4 py-2 bg-white border border-stone-200 hover:border-brand-300 hover:text-brand-600 rounded-xl text-sm text-stone-600 transition-all duration-200"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 px-6 bg-brand-500">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl text-white mb-4">
            Pronto para dar o primeiro passo?
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            É grátis, anônimo e sem julgamentos.
          </p>
          <button
            onClick={() => navigate('/cadastro')}
            className="bg-white text-brand-600 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors duration-200 shadow-md"
          >
            Criar conta agora
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-stone-100 text-center text-stone-400 text-sm">
        <p>© {new Date().getFullYear()} SafeTalk · Feito com cuidado 💙</p>
        <p className="mt-1 text-xs">
          Este serviço não substitui atendimento psicológico ou psiquiátrico profissional.
        </p>
      </footer>
    </div>
  )
}
