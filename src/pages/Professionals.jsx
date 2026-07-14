import { useState, useEffect } from 'react'
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import Icon from '../components/Icon'
import { DIRECTORY_AREA_FILTERS, PROFESSIONAL_AREA_OPTIONS } from '../constants/options'

const AREAS = DIRECTORY_AREA_FILTERS

function StarRating({ value = 0 }) {
  const rating = Number(value)
  return (
    <div className="flex items-center gap-1 text-xs text-stone-500">
      <Icon name="star" className={rating > 0 ? 'w-3.5 h-3.5 text-amber-400' : 'w-3.5 h-3.5 text-stone-300'} filled={rating > 0} />
      <span>{rating > 0 ? rating.toFixed(1) : 'Novo'}</span>
    </div>
  )
}

function normalizeRating(value) {
  const rating = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(rating)) return null
  return Math.min(5, Math.max(1, Math.round(rating)))
}

function normalizeMoney(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(String(value).replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(number) && number >= 0 ? number : null
}

function formatMoney(value) {
  const number = normalizeMoney(value)
  return number === null ? '' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function ProfessionalCard({ prof, onAgendar, disabledAction = false }) {
  const iniciais = prof.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  const areas = prof.areas?.length ? prof.areas : [prof.especialidade].filter(Boolean)
  const acceptsRequests = prof.preferencias?.aceitarSolicitacoes !== false
  const isUnavailable = !disabledAction && !acceptsRequests
  const shouldShowValue = prof.preferencias?.mostrarValorConsulta !== false
  const consultaValue = shouldShowValue ? formatMoney(prof.valorConsulta) : ''

  return (
    <article className="card p-5 transition-colors duration-150 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-brand-600 text-stone-50 flex items-center justify-center font-sans font-semibold text-lg flex-shrink-0">
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
              {isUnavailable && (
                <span className="directory-privacy-badge badge border border-amber-100 bg-amber-50 text-amber-700">
                  <Icon name="clock" className="w-3 h-3" />
                  Indisponivel
                </span>
              )}
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
            {consultaValue && (
              <p className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <span className="font-medium text-stone-700">Valor:</span> {consultaValue}
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
            <button
              onClick={() => onAgendar(prof)}
              disabled={disabledAction || isUnavailable}
              className="btn-primary text-xs py-2 gap-2"
            >
              <Icon name="mail" className="w-3.5 h-3.5" />
              {disabledAction ? 'Seu perfil' : isUnavailable ? 'Indisponivel' : 'Solicitar contato'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Professionals({ user, viewerProfile }) {
  const [profissionais, setProfissionais] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [area, setArea] = useState('Todas')
  const [agendando, setAgendando] = useState(null)
  const [requestForm, setRequestForm] = useState({ motivo: '', categoria: 'Outros' })
  const [savingRequest, setSavingRequest] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const loggedUserIsListedProfessional = profissionais.some((prof) => prof.id === user?.uid)
  const isProfessionalViewer = viewerProfile?.tipo === 'profissional' || loggedUserIsListedProfessional
  const isOwnProfessionalProfile = Boolean(agendando?.id && agendando.id === user?.uid)
  const blocksPatientActions = isProfessionalViewer || isOwnProfessionalProfile

  useEffect(() => {
    const fetchProfs = async () => {
      try {
        const q = query(collection(db, 'users'), where('tipo', '==', 'profissional'))
        const [snap, reviewSnap] = await Promise.all([
          getDocs(q),
          getDocs(collection(db, 'reviews')),
        ])
        const reviews = reviewSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        const data = snap.docs.map(d => {
          const prof = { id: d.id, ...d.data() }
          const ownReviews = reviews
            .filter((review) => review.profissionalUid === d.id)
            .map((review) => normalizeRating(review.nota))
            .filter((nota) => nota !== null)
          const media = ownReviews.length ? ownReviews.reduce((sum, nota) => sum + nota, 0) / ownReviews.length : 0
          return { ...prof, media, totalAvaliacoes: ownReviews.length }
        })
        setProfissionais(data)
      } catch (e) {
        console.error('Erro ao carregar profissionais:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfs()
  }, [])

  const openContactModal = async (prof) => {
    if (prof.preferencias?.aceitarSolicitacoes === false && prof.id !== user?.uid) {
      setModalMessage('Este profissional nao esta aceitando novas solicitacoes no momento.')
      return
    }

    setAgendando(prof)
    setRequestForm({ motivo: '', categoria: 'Outros' })
    setModalMessage('')

    try {
      await addDoc(collection(db, 'profileViews'), {
        profissionalUid: prof.id,
        profissionalNome: prof.nome || '',
        pacienteUid: user?.uid || 'anon',
        pacienteNome: user?.displayName || 'Usuario anonimo',
        origem: 'diretorio',
        criadaEm: serverTimestamp(),
      })
    } catch (error) {
      console.error('Erro ao registrar acesso ao perfil:', error)
      setModalMessage('Perfil aberto, mas nao foi possivel registrar o acesso nas estatisticas.')
    }
  }

  const sendRequest = async () => {
    if (!agendando) return
    if (blocksPatientActions) {
      setModalMessage('Perfis profissionais nao podem solicitar contato por este fluxo.')
      return
    }
    if (agendando.preferencias?.aceitarSolicitacoes === false) {
      setModalMessage('Este profissional nao esta aceitando novas solicitacoes no momento.')
      return
    }
    if (!requestForm.motivo.trim()) {
      setModalMessage('Descreva rapidamente o motivo do contato.')
      return
    }

    setSavingRequest(true)
    setModalMessage('')
    try {
      const existingSnap = await getDocs(query(
        collection(db, 'requests'),
        where('pacienteUid', '==', user.uid)
      ))
      const hasOpenRequest = existingSnap.docs.some((docSnap) => {
        const request = docSnap.data()
        const status = request.status || 'nova'
        return request.profissionalUid === agendando.id && ['nova', 'pendente', 'aceita'].includes(status)
      })
      if (hasOpenRequest) {
        setModalMessage('Voce ja tem uma solicitacao ou atendimento aberto com este profissional.')
        return
      }

      await addDoc(collection(db, 'requests'), {
        profissionalUid: agendando.id,
        profissionalNome: agendando.nome || '',
        pacienteUid: user?.uid || 'anon',
        pacienteNome: user?.displayName || 'Usuario anonimo',
        pacienteEmail: user?.email || '',
        motivo: requestForm.motivo.trim(),
        categoria: requestForm.categoria || 'Outros',
        status: 'nova',
        criadaEm: serverTimestamp(),
        atualizadaEm: serverTimestamp(),
      })
      setModalMessage('Solicitacao enviada com sucesso.')
      setRequestForm({ motivo: '', categoria: 'Outros' })
    } catch (error) {
      console.error('Erro ao enviar solicitacao:', error)
      setModalMessage(error.message || 'Nao foi possivel enviar a solicitacao.')
    } finally {
      setSavingRequest(false)
    }
  }

  const visibleProfessionals = profissionais.filter((p) => p.preferencias?.perfilPublico !== false || p.id === user?.uid)
  const filtrados = visibleProfessionals.filter((p) => {
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
      <section className="rounded-lg bg-brand-800 text-stone-50 p-6 md:p-7 overflow-hidden relative">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-100 bg-stone-50/10 border border-stone-50/20 px-3 py-1.5 rounded-full">
            <Icon name="shield" className="w-3.5 h-3.5" />
            Diretório verificado
          </span>
          <h1 className="font-serif text-3xl mt-4 mb-2">Profissionais para continuar o cuidado</h1>
          <p className="text-stone-300 text-sm leading-relaxed">
            Busque por area, abordagem ou disponibilidade. A ideia aqui e facilitar o primeiro contato, sem transformar o apoio em algo frio.
          </p>
        </div>
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
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                area === item
                  ? 'bg-brand-600 text-stone-50 border-brand-600'
                  : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:border-brand-200 hover:text-brand-700'
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
            <ProfessionalCard
              key={prof.id}
              prof={prof}
              onAgendar={openContactModal}
              disabledAction={isProfessionalViewer || prof.id === user?.uid}
            />
          ))}
        </div>
      )}

      {agendando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="contact-modal glass-panel p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-serif text-xl text-stone-900 mb-1">Solicitar contato</h3>
            <p className="text-stone-500 text-sm mb-4">
              Voce esta enviando uma solicitacao para <strong>{agendando.nome}</strong>.
            </p>
            {modalMessage && (
              <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${modalMessage.includes('sucesso') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
                {modalMessage}
              </div>
            )}
            {blocksPatientActions ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                Contas profissionais podem visualizar o diretorio, mas nao podem solicitar contato nem avaliar outros profissionais por este fluxo.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="label">Motivo do contato</label>
                    <textarea className="input-field" rows={3} value={requestForm.motivo} onChange={(e) => setRequestForm((current) => ({ ...current, motivo: e.target.value }))} placeholder="Conte brevemente o que voce procura." />
                  </div>
                  <div>
                    <label className="label">Categoria</label>
                    <select className="contact-category input-field" value={requestForm.categoria} onChange={(e) => setRequestForm((current) => ({ ...current, categoria: e.target.value }))}>
                      {PROFESSIONAL_AREA_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                      <option>Outros</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setAgendando(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={sendRequest}
                disabled={savingRequest || blocksPatientActions}
                className="btn-primary flex-1"
              >
                {savingRequest ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
