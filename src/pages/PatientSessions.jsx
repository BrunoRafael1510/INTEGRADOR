import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import Icon from '../components/Icon'
import SessionChat from '../components/SessionChat'

function toDate(value) {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

function formatDate(value) {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date) : 'Sem data'
}

function initials(name) {
  return String(name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

export default function PatientSessions({ user }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!user?.uid) {
      setSessions([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setMessage('')
    const unsubscribe = onSnapshot(
      query(collection(db, 'requests'), where('pacienteUid', '==', user.uid)),
      (snap) => {
        const data = snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((request) => ['aceita', 'finalizada'].includes(request.status))
          .sort((a, b) => (toDate(b.respondidaEm || b.finalizadaEm || b.atualizadaEm || b.criadaEm)?.getTime() || 0) - (toDate(a.respondidaEm || a.finalizadaEm || a.atualizadaEm || a.criadaEm)?.getTime() || 0))
        setSessions(data)
        setSelectedId((current) => current || data[0]?.id || '')
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar atendimentos do paciente:', error)
        setMessage(error.message || 'Nao foi possivel carregar seus atendimentos.')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user?.uid])

  const activeSessions = sessions.filter((session) => session.status === 'aceita')
  const selectedSession = sessions.find((session) => session.id === selectedId) || activeSessions[0] || sessions[0] || null

  return (
    <div className="space-y-6">
      <section>
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
          <Icon name="heart" className="h-3.5 w-3.5" />
          Atendimentos
        </span>
        <h1 className="font-sans text-2xl font-bold text-stone-900 md:text-3xl">Meus atendimentos</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Quando um profissional aceitar sua solicitacao, o chat aparece aqui.
        </p>
      </section>

      {message && <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}

      {loading ? (
        <div className="card p-8 text-center text-sm text-stone-500">Carregando atendimentos...</div>
      ) : sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
            <Icon name="heart" className="h-6 w-6" />
          </div>
          <p className="font-sans text-lg font-semibold text-stone-900">Nenhum atendimento ainda</p>
          <p className="mt-1 text-sm text-stone-500">Solicite contato com um profissional e aguarde ele aceitar.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.75fr)_minmax(440px,1.25fr)]">
          <div className="space-y-3">
            {sessions.map((session) => (
              <article key={session.id} className={`ops-flow-card card request-card p-4 ${selectedSession?.id === session.id ? 'request-card-active' : ''}`}>
                <button type="button" onClick={() => setSelectedId(session.id)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
                      {initials(session.profissionalNome || 'Profissional')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium text-stone-950">{session.profissionalNome || 'Profissional'}</h2>
                        <span className={`badge request-status request-status-${session.status} border border-stone-200 bg-stone-50 text-stone-600`}>
                          {session.status === 'aceita' ? 'em atendimento' : 'finalizado'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600">{session.motivo || 'Sem motivo informado'}</p>
                      {session.agendadaPara && (
                        <p className="mt-2 text-xs font-medium text-brand-700">Agendado para {formatDate(session.agendadaPara)}</p>
                      )}
                      <p className="mt-2 text-xs text-stone-400">{formatDate(session.respondidaEm || session.finalizadaEm || session.atualizadaEm)}</p>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
          <SessionChat session={selectedSession} user={user} role="paciente" />
        </div>
      )}
    </div>
  )
}
