import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import Icon from '../components/Icon'

const AREAS = [
  'Todas',
  'Psicologia clinica',
  'Ansiedade e estresse',
  'Relacionamentos',
  'Terapia familiar',
  'Luto',
  'Autoestima',
  'Adolescencia',
  'Orientacao profissional',
]

function StarRating({ value = 0 }) {
  return (
    <div className="flex items-center gap-1 text-xs text-stone-500">
      <Icon name="star" className={value > 0 ? 'w-3.5 h-3.5 text-amber-400' : 'w-3.5 h-3.5 text-stone-300'} filled={value > 0} />
      <span>{value > 0 ? value.toFixed(1) : 'Novo'}</span>
    </div>
  )
}

function ProfessionalCard({ prof, onAgendar }) {
  const iniciais = prof.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  const areas = prof.areas?.length ? prof.areas : [prof.especialidade].filter(Boolean)

  return (
    <article className="card p-5 hover:shadow-card transition-shadow duration-300 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-700 to-cyan-500 text-white flex items-center justify-center font-sans font-extrabold text-lg flex-shrink-0 shadow-soft">
          {iniciais}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="font-medium text-stone-900">{prof.nome}</h3>
              <p className="text-sm text-brand-700 font-medium">{prof.especialidade || areas[0] || 'Profissional de apoio'}</p>
              {prof.crp && <p className="text-xs text-stone-400 mt-1">{prof.crp}</p>}
            </div>
            <div className="flex items-center gap-2">
              <StarRating value={prof.media || 0} />
              <span className="badge bg-sage-50 text-sage-700 border border-sage-100">
                <Icon name="check" className="w-3 h-3" />
                Verificado
              </span>
            </div>
          </div>

          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {areas.slice(0, 3).map((area) => (
                <span key={area} className="badge bg-stone-50 text-stone-600 border border-stone-200">
                  {area}
                </span>
              ))}
            </div>
          )}

          {prof.descricao && (
            <p className="text-sm text-stone-600 mt-3 leading-relaxed line-clamp-2">
              {prof.descricao}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-2 mt-4 text-xs text-stone-500">
            {prof.abordagem && (
              <p className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <span className="font-medium text-stone-700">Abordagem:</span> {prof.abordagem}
              </p>
            )}
            {prof.atendimento && (
              <p className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <span className="font-medium text-stone-700">Atendimento:</span> {prof.atendimento}
              </p>
            )}
            {prof.disponibilidade && (
              <p className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 sm:col-span-2">
                <span className="font-medium text-stone-700">Disponibilidade:</span> {prof.disponibilidade}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <p className="text-xs text-stone-400">Contato mediado pelo SafeTalk.</p>
            <button onClick={() => onAgendar(prof)} className="btn-primary text-xs py-2 gap-2">
              <Icon name="mail" className="w-3.5 h-3.5" />
              Solicitar contato
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Professionals() {
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [area, setArea] = useState('Todas')
  const [agendando, setAgendando] = useState(null)

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const q = query(collection(db, 'users'), where('tipo', '==', 'profissional'))
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setProfissionais(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfs()
  }, [])

  const filtrados = profissionais.filter((p) => {
    const termo = busca.toLowerCase()
    const texto = [
      p.nome,
      p.especialidade,
      p.abordagem,
      p.descricao,
      ...(p.areas || []),
    ].filter(Boolean).join(' ').toLowerCase()
    const matchBusca = texto.includes(termo)
    const matchArea = area === 'Todas' || p.areas?.includes(area) || p.especialidade === area
    return matchBusca && matchArea
  })

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-gradient-to-br from-slate-950 via-brand-900 to-cyan-900 text-white p-6 md:p-7 overflow-hidden relative shadow-card">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-100 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
            <Icon name="shield" className="w-3.5 h-3.5" />
            Diretório verificado
          </span>
          <h1 className="font-serif text-3xl mt-4 mb-2">Profissionais para continuar o cuidado</h1>
          <p className="text-stone-300 text-sm leading-relaxed">
            Busque por area, abordagem ou disponibilidade. A ideia aqui e facilitar o primeiro contato, sem transformar o apoio em algo frio.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-14 w-48 h-48 rounded-full border border-white/10" />
      </section>

      <section className="card p-4 space-y-4">
        <div className="relative">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, area ou abordagem..."
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {AREAS.map((item) => (
            <button
              key={item}
              onClick={() => setArea(item)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                area === item
                  ? 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white border-transparent shadow-soft'
                  : 'bg-white/70 border-white/70 text-slate-600 hover:border-brand-200 hover:text-brand-700 backdrop-blur-xl'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
        <Icon name="alert" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">Quando buscar ajuda profissional?</p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            Se os sentimentos estiverem afetando sono, trabalho, estudos ou seguranca, vale procurar atendimento especializado. Em emergencia, procure um servico de urgencia.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-14 h-14 rounded-lg bg-stone-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-32" />
                <div className="h-3 bg-stone-100 rounded w-24" />
                <div className="h-3 bg-stone-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-500 mx-auto mb-4 flex items-center justify-center">
            <Icon name="users" className="w-6 h-6" />
          </div>
          <p className="font-serif text-lg text-stone-800 mb-1">
            {busca || area !== 'Todas' ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado ainda'}
          </p>
          <p className="text-stone-400 text-sm">
            {busca || area !== 'Todas' ? 'Tente outro termo ou limpe os filtros.' : 'Quando houver perfis aprovados, eles aparecem aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map(prof => (
            <ProfessionalCard key={prof.id} prof={prof} onAgendar={setAgendando} />
          ))}
        </div>
      )}

      {agendando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="glass-panel p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-serif text-xl text-stone-900 mb-1">Solicitar contato</h3>
            <p className="text-stone-500 text-sm mb-4">
              Voce esta enviando uma solicitacao para <strong>{agendando.nome}</strong>.
            </p>
            <div className="bg-stone-50 rounded-lg p-4 text-sm text-stone-600 mb-6 flex gap-2">
              <Icon name="mail" className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>Em breve voce recebera um e-mail com os proximos passos para agendar sua consulta.</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAgendando(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => { alert('Solicitacao enviada! Funcionalidade em desenvolvimento.'); setAgendando(null) }}
                className="btn-primary flex-1"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
