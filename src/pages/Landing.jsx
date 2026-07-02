import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'

const features = [
  {
    icon: 'lock',
    title: 'Anonimato real',
    desc: 'Seus desabafos aparecem sem identificacao publica. Voce escolhe o quanto compartilha.',
  },
  {
    icon: 'message',
    title: 'Apoio da comunidade',
    desc: 'Receba respostas de pessoas dispostas a ouvir com cuidado e sem julgamento.',
  },
  {
    icon: 'users',
    title: 'Diretorio profissional',
    desc: 'Quando quiser, encontre profissionais por area, abordagem e disponibilidade.',
  },
  {
    icon: 'spark',
    title: 'IA acolhedora',
    desc: 'A IA ajuda a reformular respostas para que soem mais gentis e empaticas.',
  },
]

const categories = [
  'Ansiedade', 'Familia', 'Relacionamentos', 'Trabalho',
  'Solidao', 'Luto', 'Autoestima', 'Outros',
]

export default function Landing({ user }) {
  const navigate = useNavigate()

  return (
    <div className="app-bg min-h-screen font-sans">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-sans text-2xl font-bold text-stone-900">SafeTalk</span>
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
                  Comecar agora
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center animate-fade-in">
          <div>
            <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-100 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
              <Icon name="shield" className="w-3.5 h-3.5" />
              Um espaco seguro para se expressar
            </span>

            <h1 className="text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
              SafeTalk
            </h1>

            <p className="text-lg text-stone-500 max-w-xl mb-10 leading-relaxed">
              Um ambiente anonimo e sem julgamentos para desabafar, receber apoio e, quando fizer sentido, se conectar com profissionais de saude mental.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <button
                onClick={() => navigate('/cadastro')}
                className="btn-primary text-base px-8 py-3"
              >
                Criar conta gratis
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-base px-8 py-3"
              >
                Ja tenho conta
              </button>
            </div>

            <p className="mt-6 text-xs text-stone-400 flex items-center gap-1.5">
              <Icon name="alert" className="w-3.5 h-3.5" />
              O SafeTalk nao substitui acompanhamento psicologico ou psiquiatrico profissional.
            </p>
          </div>

          <div className="card p-5">
            <div className="rounded-lg bg-brand-800 text-stone-50 p-5 mb-4">
              <p className="text-xs text-stone-200 mb-3">Feed anonimo</p>
              <p className="text-sm leading-relaxed text-stone-50">
                "Hoje foi dificil, mas escrever aqui me ajudou a organizar o que eu estava sentindo."
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-stone-200 p-3">
                <Icon name="message" className="w-4 h-4 text-brand-600 mt-0.5" />
                <p className="text-sm text-stone-600">Respostas empaticas de outras pessoas da comunidade.</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-stone-200 p-3">
                <Icon name="users" className="w-4 h-4 text-sage-600 mt-0.5" />
                <p className="text-sm text-stone-600">Profissionais organizados por area de atuacao.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-stone-50/50 border-y border-stone-200 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-sans text-3xl font-bold text-stone-900 text-center mb-12">
            Feito para quem precisa ser ouvido
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 transition-colors duration-150">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center mb-4">
                  <Icon name={f.icon} className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-semibold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-sans text-3xl font-bold text-stone-900 mb-4">
            Explore por categoria
          </h2>
          <p className="text-stone-500 mb-10">
            Encontre pessoas que entendem algo parecido com o que voce esta passando.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate('/cadastro')}
                className="px-4 py-2 bg-stone-50/80 border border-stone-200 hover:border-brand-300 hover:text-brand-700 rounded-full text-sm text-stone-600 transition-colors duration-150"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-brand-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-sans text-4xl font-bold text-stone-50 mb-4">
            Comece do jeito que fizer sentido hoje.
          </h2>
          <p className="text-stone-200 mb-8 text-lg">
            Voce pode apenas ler, desabafar ou procurar ajuda profissional.
          </p>
          <button
            onClick={() => navigate('/cadastro')}
            className="bg-stone-50 text-stone-900 font-medium px-8 py-3 rounded-lg hover:bg-stone-100 transition-colors duration-150"
          >
            Criar conta agora
          </button>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-stone-200 text-center text-stone-400 text-sm">
        <p>© {new Date().getFullYear()} SafeTalk · Feito com cuidado</p>
        <p className="mt-1 text-xs">
          Este servico nao substitui atendimento psicologico ou psiquiatrico profissional.
        </p>
      </footer>
    </div>
  )
}
