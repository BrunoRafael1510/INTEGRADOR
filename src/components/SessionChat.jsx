import { useEffect, useMemo, useState } from 'react'
import { addDoc, arrayUnion, collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import Icon from './Icon'

function toDate(value) {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

function formatTime(value) {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date) : ''
}

function initials(name) {
  return String(name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

export default function SessionChat({ session, user, role = 'paciente' }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const canChat = Boolean(session?.id && user?.uid)

  useEffect(() => {
    if (!canChat) {
      setMessages([])
      setError('')
      return undefined
    }

    const participantField = role === 'profissional' ? 'profissionalUid' : 'pacienteUid'
    const q = query(
      collection(db, 'messages'),
      where(participantField, '==', user.uid)
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((message) => String(message.atendimentoId || message.requestId || '') === String(session.id))
          .sort((a, b) => {
            const first = toDate(a.criadaEm)?.getTime() || 0
            const second = toDate(b.criadaEm)?.getTime() || 0
            return first - second
          })
        setMessages(data)
        setError('')
        data.forEach((message) => {
          const readBy = message.readBy || []
          if (message.senderUid !== user.uid && !readBy.includes(user.uid)) {
            updateDoc(doc(db, 'messages', message.id), {
              readBy: arrayUnion(user.uid),
              lidaEm: serverTimestamp(),
            }).catch((err) => console.error('Erro ao marcar mensagem como lida:', err))
          }
        })
      },
      (err) => {
        console.error('Erro ao carregar chat:', err)
        setError(err.message || 'Nao foi possivel carregar o chat.')
      }
    )

    return unsubscribe
  }, [canChat, role, session?.id, user?.uid])

  const recipientName = useMemo(() => {
    if (!session) return ''
    return role === 'profissional' ? session.pacienteNome || 'Paciente' : session.profissionalNome || 'Profissional'
  }, [role, session])
  const isFinalized = session?.status === 'finalizada'

  const sendMessage = async (event) => {
    event.preventDefault()
    const cleanText = text.trim()
    if (!cleanText || !canChat || isFinalized) return

    setSending(true)
    setError('')
    try {
      await addDoc(collection(db, 'messages'), {
        atendimentoId: session.id,
        requestId: session.id,
        profissionalUid: session.profissionalUid || '',
        pacienteUid: session.pacienteUid || '',
        senderUid: user.uid,
        senderName: user.displayName || user.email || (role === 'profissional' ? 'Profissional' : 'Paciente'),
        senderRole: role,
        texto: cleanText,
        readBy: [user.uid],
        criadaEm: serverTimestamp(),
      })
      setText('')
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setError(err.message || 'Nao foi possivel enviar a mensagem.')
    } finally {
      setSending(false)
    }
  }

  if (!session) {
    return (
      <div className="card p-6 text-center">
        <Icon name="message" className="mx-auto mb-3 h-6 w-6 text-stone-400" />
        <p className="text-sm text-stone-500">Selecione um atendimento para abrir o chat.</p>
      </div>
    )
  }

  return (
    <section className="session-chat card overflow-hidden">
      <div className="session-chat-header border-b border-stone-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-stone-50 shadow-soft">
            {initials(recipientName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-normal text-stone-400">Chat do atendimento</p>
            <h2 className="truncate font-sans text-lg font-semibold text-stone-950">{recipientName}</h2>
          </div>
          <span className={`badge border ${isFinalized ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-brand-100 bg-brand-50 text-brand-700'}`}>
            {isFinalized ? 'Finalizado' : 'Em atendimento'}
          </span>
        </div>
      </div>

      <div className="max-h-[62vh] min-h-[420px] space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="session-empty-chat flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center">
            <Icon name="message" className="mb-3 h-6 w-6 text-brand-600" />
            <p className="text-sm font-medium text-stone-700">Comece a conversa</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-400">Use este chat para combinar orientacoes, horarios e proximos passos do atendimento.</p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.senderUid === user?.uid
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`session-message max-w-[82%] rounded-lg border px-3 py-2 shadow-sm ${mine ? 'session-message-mine border-brand-100 bg-brand-50 text-brand-900' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
                  <p className="text-sm leading-relaxed">{message.texto}</p>
                  <p className={`mt-1 text-[11px] ${mine ? 'text-brand-700' : 'text-stone-400'}`}>{formatTime(message.criadaEm)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && <p className="mx-4 mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {isFinalized && (
        <p className="mx-4 mb-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
          Este atendimento foi finalizado. O chat fica disponivel apenas para historico.
        </p>
      )}

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-stone-200 p-4">
        <input
          className="input-field min-h-10 py-2"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={isFinalized}
          placeholder={isFinalized ? 'Atendimento finalizado' : 'Escreva uma mensagem...'}
        />
        <button type="submit" disabled={isFinalized || sending || !text.trim()} className="btn-primary shrink-0 px-4">
          <Icon name={sending ? 'refresh' : 'mail'} className={`h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
        </button>
      </form>
    </section>
  )
}
