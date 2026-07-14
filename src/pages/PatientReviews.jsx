import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import Icon from '../components/Icon'

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null
  return date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date) : 'Sem data'
}

function normalizeRating(value) {
  const rating = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(rating)) return null
  return Math.min(5, Math.max(1, Math.round(rating)))
}

export default function PatientReviews({ user }) {
  const [items, setItems] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [message, setMessage] = useState('')
  const [forms, setForms] = useState({})

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      setLoading(true)
      setMessage('')
      try {
        const [requestSnap, appointmentSnap, reviewSnap] = await Promise.all([
          getDocs(query(collection(db, 'requests'), where('pacienteUid', '==', user.uid))),
          getDocs(query(collection(db, 'appointments'), where('pacienteUid', '==', user.uid))),
          getDocs(query(collection(db, 'reviews'), where('pacienteUid', '==', user.uid))),
        ])

        const finalizedRequests = requestSnap.docs
          .map((docSnap) => ({ id: docSnap.id, origem: 'solicitacao', ...docSnap.data() }))
          .filter((item) => item.status === 'finalizada' && item.profissionalUid)

        const finalizedAppointments = appointmentSnap.docs
          .map((docSnap) => ({ id: docSnap.id, origem: 'agenda', ...docSnap.data() }))
          .filter((item) => ['concluida', 'finalizada'].includes(item.status) && item.profissionalUid)

        const requestIds = new Set(finalizedRequests.map((item) => item.id))
        const uniqueAppointments = finalizedAppointments.filter((item) => !item.requestId || !requestIds.has(item.requestId))
        setItems([...finalizedRequests, ...uniqueAppointments])
        setReviews(reviewSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
      } catch (error) {
        console.error('Erro ao carregar avaliacoes do paciente:', error)
        setMessage(error.message || 'Nao foi possivel carregar seus atendimentos finalizados.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.uid])

  const reviewKeys = useMemo(
    () => new Set(reviews.map((review) => review.atendimentoId || `${review.profissionalUid}-${review.origem || 'diretorio'}`)),
    [reviews]
  )

  const setForm = (id, patch) => {
    setForms((current) => ({
      ...current,
      [id]: { nota: '5', comentario: '', ...(current[id] || {}), ...patch },
    }))
  }

  const submitReview = async (item) => {
    const form = forms[item.id] || { nota: '5', comentario: '' }
    const nota = normalizeRating(form.nota)
    if (!nota) {
      setMessage('Informe uma nota valida entre 1 e 5.')
      return
    }

    setSavingId(item.id)
    setMessage('')
    try {
      const payload = {
        profissionalUid: item.profissionalUid,
        profissionalNome: item.profissionalNome || '',
        pacienteUid: user.uid,
        pacienteNome: user.displayName || 'Usuario anonimo',
        nota,
        comentario: String(form.comentario || '').trim(),
        origem: item.origem,
        atendimentoId: item.id,
        criadaEm: serverTimestamp(),
      }
      const reviewId = `${user.uid}_${item.id}`
      await setDoc(doc(db, 'reviews', reviewId), payload, { merge: false })
      setReviews((current) => [{ id: reviewId, ...payload }, ...current])
      setMessage('Avaliacao enviada com sucesso.')
      setForms((current) => ({ ...current, [item.id]: { nota: '5', comentario: '' } }))
    } catch (error) {
      console.error('Erro ao enviar avaliacao:', error)
      setMessage(error.message || 'Nao foi possivel enviar a avaliacao.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
          <Icon name="star" className="h-3.5 w-3.5" />
          Avaliacoes
        </span>
        <h1 className="font-sans text-2xl font-bold text-stone-900 md:text-3xl">Avaliar profissionais</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Avalie apenas profissionais com atendimento finalizado.
        </p>
      </section>

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${message.includes('sucesso') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-sm text-stone-500">Carregando atendimentos...</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
            <Icon name="star" className="h-6 w-6" />
          </div>
          <p className="font-sans text-lg font-semibold text-stone-900">Nenhum atendimento para avaliar</p>
          <p className="mt-1 text-sm text-stone-500">Quando uma solicitacao ou consulta for finalizada, ela aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const alreadyReviewed = reviewKeys.has(item.id)
            const form = forms[item.id] || { nota: '5', comentario: '' }
            return (
              <article key={`${item.origem}-${item.id}`} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-medium text-stone-950">{item.profissionalNome || 'Profissional'}</h2>
                    <p className="mt-1 text-sm text-stone-500">{item.motivo || item.titulo || 'Atendimento finalizado'}</p>
                    <p className="mt-2 text-xs text-stone-400">{formatDate(item.finalizadaEm || item.data || item.atualizadaEm)}</p>
                  </div>
                  <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{alreadyReviewed ? 'Avaliado' : 'Pendente'}</span>
                </div>

                {!alreadyReviewed && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[110px_1fr]">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="1"
                      className="input-field"
                      value={form.nota}
                      onChange={(event) => setForm(item.id, { nota: event.target.value })}
                    />
                    <input
                      className="input-field"
                      value={form.comentario}
                      onChange={(event) => setForm(item.id, { comentario: event.target.value })}
                      placeholder="Comentario opcional"
                    />
                    <button onClick={() => submitReview(item)} disabled={savingId === item.id} className="btn-primary sm:col-span-2 gap-2">
                      <Icon name="star" />
                      {savingId === item.id ? 'Enviando...' : 'Enviar avaliacao'}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
