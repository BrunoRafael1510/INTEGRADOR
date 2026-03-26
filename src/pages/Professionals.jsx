// src/pages/Professionals.jsx
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'

function StarRating({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= Math.round(value) ? 'text-yellow-400' : 'text-stone-200'}`}>★</span>
      ))}
      <span className="text-xs text-stone-400 ml-1">{value > 0 ? value.toFixed(1) : 'Novo'}</span>
    </div>
  )
}

function ProfessionalCard({ prof, onAgendar }) {
  const iniciais = prof.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="card p-5 hover:shadow-card transition-shadow duration-300 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-sage-100 flex items-center justify-center font-serif text-brand-600 font-semibold text-lg flex-shrink-0">
          {iniciais}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-stone-800">{prof.nome}</h3>
              <p className="text-xs text-brand-600 font-medium">{prof.especialidade}</p>
            </div>
            <StarRating value={prof.media || 0} />
          </div>

          {prof.crp && (
            <p className="text-xs text-stone-400 mt-1">{prof.crp}</p>
          )}

          {prof.descricao && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed line-clamp-2">
              {prof.descricao}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => onAgendar(prof)}
              className="btn-primary text-xs py-1.5"
            >
              Solicitar contato
            </button>
            <span className="text-xs text-sage-600 bg-sage-50 px-2 py-1 rounded-full border border-sage-100">
              ✓ Verificado
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Professionals() {
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
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

  const filtrados = profissionais.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.especialidade?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-stone-900 mb-1">Profissionais</h1>
        <p className="text-stone-500 text-sm">Encontre psicólogos e terapeutas verificados.</p>
      </div>

      {/* Aviso */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex gap-3">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-sm font-medium text-amber-800">Quando buscar ajuda profissional?</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Se os sentimentos estiverem te impedindo de viver, dormir ou trabalhar, considere marcar uma consulta. Cuidar da saúde mental é tão importante quanto a física.
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou especialidade..."
          className="input-field pl-9"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-5 animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-32" />
                <div className="h-3 bg-stone-100 rounded w-24" />
                <div className="h-3 bg-stone-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🩺</p>
          <p className="font-serif text-lg text-stone-700 mb-1">
            {busca ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado ainda'}
          </p>
          <p className="text-stone-400 text-sm">
            {busca ? 'Tente outros termos.' : 'Em breve teremos profissionais disponíveis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrados.map(prof => (
            <ProfessionalCard key={prof.id} prof={prof} onAgendar={setAgendando} />
          ))}
        </div>
      )}

      {/* Modal de agendamento simples */}
      {agendando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-card p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-serif text-xl text-stone-900 mb-1">Solicitar contato</h3>
            <p className="text-stone-500 text-sm mb-4">
              Enviando solicitação para <strong>{agendando.nome}</strong>.
            </p>
            <div className="bg-stone-50 rounded-xl p-4 text-sm text-stone-600 mb-6">
              📧 Em breve você receberá um e-mail com os próximos passos para agendar sua consulta.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAgendando(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => { alert('Solicitação enviada! (funcionalidade em desenvolvimento)'); setAgendando(null) }}
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
