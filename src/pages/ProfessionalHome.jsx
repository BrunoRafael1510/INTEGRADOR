import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteDoc, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, arrayUnion, collection, where } from 'firebase/firestore'
import { deleteUser, updateEmail, updatePassword } from 'firebase/auth'
import { db } from '../services/firebase'
import Icon from '../components/Icon'

const REQUEST_STATUS = ['nova', 'pendente', 'aceita', 'recusada', 'finalizada']
const CATEGORIES = ['Todas', 'Ansiedade', 'Depressao', 'Relacionamentos', 'Familia', 'Trabalho', 'Estudos', 'Autoestima', 'Outros']
const PROFILE_FIELDS = [
  'fotoUrl', 'nome', 'crp', 'especialidade', 'areas', 'formacao', 'experiencia', 'descricao',
  'atendimento', 'cidade', 'estado', 'valorConsulta', 'idiomas', 'disponibilidade',
]

function toDate(value) {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

function formatDate(value) {
  const date = toDate(value)
  return date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date) : 'Sem data'
}

function minutesBetween(start, end) {
  const a = toDate(start)
  const b = toDate(end)
  if (!a || !b) return null
  return Math.max(0, Math.round((b - a) / 60000))
}

function timeAgo(value) {
  const date = toDate(value)
  if (!date) return 'Sem data'
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function average(values) {
  const valid = values.filter((item) => Number.isFinite(item))
  if (!valid.length) return 0
  return valid.reduce((sum, item) => sum + item, 0) / valid.length
}

function arrayFromText(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function textFromArray(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

function profileCompletion(profile) {
  const filled = PROFILE_FIELDS.filter((field) => {
    const value = profile?.[field]
    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  }).length
  return Math.round((filled / PROFILE_FIELDS.length) * 100)
}

function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="glass-panel border-dashed p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="font-sans text-lg font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-stone-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">
            {eyebrow}
          </span>
        )}
        <h1 className="font-sans text-2xl font-bold tracking-normal text-stone-900 md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STAT_TONES = {
  users: {
    icon: 'border-blue-100 bg-blue-50 text-blue-600',
    glow: 'from-blue-500/18',
    bars: 'from-blue-500 to-brand-600',
    change: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  calendar: {
    icon: 'border-brand-100 bg-brand-50 text-brand-700',
    glow: 'from-brand-500/0',
    bars: 'from-brand-500 to-brand-600',
    change: 'text-brand-700 bg-brand-50 border-brand-100',
  },
  star: {
    icon: 'border-amber-100 bg-amber-50 text-amber-500',
    glow: 'from-amber-400/18',
    bars: 'from-amber-400 to-orange-400',
    change: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  message: {
    icon: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    glow: 'from-cyan-500/0',
    bars: 'from-cyan-400 to-cyan-500',
    change: 'text-cyan-700 bg-cyan-50 border-cyan-100',
  },
  inbox: {
    icon: 'border-brand-100 bg-brand-50 text-brand-700',
    glow: 'from-brand-500/0',
    bars: 'from-brand-500 to-cyan-400',
    change: 'text-brand-700 bg-brand-50 border-brand-100',
  },
  heart: {
    icon: 'border-rose-100 bg-rose-50 text-rose-500',
    glow: 'from-rose-400/18',
    bars: 'from-rose-400 to-violet-500',
    change: 'text-rose-600 bg-rose-50 border-rose-100',
  },
}

function MiniSparkline({ tone }) {
  const heights = ['35%', '58%', '45%', '72%', '54%', '86%', '68%']
  return (
    <div className="flex h-8 items-end gap-1">
      {heights.map((height, index) => (
        <span
          key={height + index}
          className="w-1.5 rounded-full bg-brand-500"
          style={{ height, opacity: index % 2 ? 0.72 : 1 }}
        />
      ))}
    </div>
  )
}

function StatCard({ label, value, icon, hint }) {
  const tone = STAT_TONES[icon] || {
    icon: 'border-brand-100 bg-brand-50 text-brand-700',
    glow: 'from-brand-500/0',
    bars: 'from-brand-500 to-brand-600',
    change: 'text-brand-700 bg-brand-50 border-brand-100',
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-stone-200 bg-stone-50/90 p-4 shadow-soft transition-colors duration-150">
      <div className="relative mb-4 flex items-center justify-between gap-3">
        <span className={`rounded-lg border p-2 shadow-sm ${tone.icon}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tone.change}`}>+12%</span>
      </div>
      <div className="relative flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tracking-normal text-stone-900">{value}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
        </div>
        <MiniSparkline tone={tone} />
      </div>
      {hint && <p className="relative mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-200/70">
      <div className="h-full rounded-full bg-brand-600 transition-all duration-150" style={{ width: `${value}%` }} />
    </div>
  )
}

function SmallBarChart({ data, emptyText }) {
  const max = Math.max(...data.map((item) => item.value), 0)
  if (!max) return <EmptyState icon="chart" title="Sem dados suficientes" description={emptyText} />

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="text-stone-500">{item.label}</span>
            <span className="font-medium text-stone-800">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-200/70">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function useProfessionalData(user) {
  const [state, setState] = useState({
    posts: [],
    requests: [],
    appointments: [],
    reviews: [],
    profileViews: [],
    savedIds: [],
    loading: true,
    error: '',
  })

  useEffect(() => {
    if (!user?.uid) return undefined

    setState((current) => ({ ...current, loading: true, error: '' }))
    const subscriptions = [
      onSnapshot(
        query(collection(db, 'posts'), orderBy('criadoEm', 'desc'), limit(120)),
        (snap) => setState((current) => ({ ...current, posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false })),
        (error) => setState((current) => ({ ...current, error: error.message, loading: false }))
      ),
      onSnapshot(
        query(collection(db, 'requests'), where('profissionalUid', '==', user.uid)),
        (snap) => setState((current) => ({ ...current, requests: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })),
        (error) => setState((current) => ({ ...current, error: error.message }))
      ),
      onSnapshot(
        query(collection(db, 'appointments'), where('profissionalUid', '==', user.uid)),
        (snap) => setState((current) => ({ ...current, appointments: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })),
        (error) => setState((current) => ({ ...current, error: error.message }))
      ),
      onSnapshot(
        query(collection(db, 'reviews'), where('profissionalUid', '==', user.uid)),
        (snap) => setState((current) => ({ ...current, reviews: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })),
        (error) => setState((current) => ({ ...current, error: error.message }))
      ),
      onSnapshot(
        query(collection(db, 'profileViews'), where('profissionalUid', '==', user.uid)),
        (snap) => setState((current) => ({ ...current, profileViews: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })),
        (error) => setState((current) => ({ ...current, error: error.message }))
      ),
      onSnapshot(
        collection(db, 'users', user.uid, 'savedPosts'),
        (snap) => setState((current) => ({ ...current, savedIds: snap.docs.map((d) => d.id) })),
        (error) => setState((current) => ({ ...current, error: error.message }))
      ),
    ]

    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [user?.uid])

  return state
}

function buildMetrics({ posts, requests, appointments, reviews, profileViews }, uid) {
  const completedAppointments = appointments.filter((item) => item.status === 'concluida' || item.status === 'finalizada')
  const finalizedRequests = requests.filter((item) => item.status === 'finalizada')
  const ownResponses = posts.flatMap((post) =>
    (post.respostas || [])
      .filter((response) => response.autorUid === uid)
      .map((response) => ({ post, response }))
  )
  const firstResponseTimes = ownResponses
    .map(({ post, response }) => minutesBetween(post.criadoEm, response.criadaEm))
    .filter((item) => item !== null)
  const respondedRequestCount = requests.filter((item) => ['aceita', 'recusada', 'finalizada'].includes(item.status)).length
  const helpedPatientIds = new Set([
    ...completedAppointments.map((item) => item.pacienteUid).filter(Boolean),
    ...finalizedRequests.map((item) => item.pacienteUid).filter(Boolean),
  ])
  const reviewAverage = average(reviews.map((item) => Number(item.nota)))

  return {
    completedAppointments: completedAppointments.length + finalizedRequests.length,
    profileViews: profileViews.length,
    answeredMessages: ownResponses.length,
    pendingRequests: requests.filter((item) => ['nova', 'pendente'].includes(item.status)).length,
    averageRating: reviewAverage ? reviewAverage.toFixed(1) : '0',
    responseRate: requests.length ? `${Math.round((respondedRequestCount / requests.length) * 100)}%` : '0%',
    averageResponseTime: firstResponseTimes.length ? `${Math.round(average(firstResponseTimes))}min` : '0min',
    helpedPatients: helpedPatientIds.size,
  }
}

function OverviewPage({ user, profile, data, metrics, onNavigate }) {
  const completion = profileCompletion(profile)

  return (
    <div>
      <SectionHeader
        eyebrow="Central profissional SafeTalk"
        title={`Ola, ${profile?.nome || user?.displayName || 'profissional'}`}
        description="Indicadores, solicitacoes e atividades abaixo sao calculados apenas a partir dos dados persistidos no Firebase."
        actions={[
          <button key="profile" onClick={() => onNavigate('profile')} className="btn-primary gap-2"><Icon name="edit" />Editar perfil</button>,
          <button key="requests" onClick={() => onNavigate('requests')} className="btn-secondary gap-2"><Icon name="inbox" />Solicitacoes</button>,
        ]}
      />

      {data.error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nao foi possivel carregar parte dos dados: {data.error}
        </div>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de atendimentos" value={metrics.completedAppointments} icon="users" hint="Atendimentos finalizados" />
        <StatCard label="Perfil visualizado" value={metrics.profileViews} icon="eye" hint="Registros em profileViews" />
        <StatCard label="Mensagens respondidas" value={metrics.answeredMessages} icon="message" hint="Respostas em desabafos" />
        <StatCard label="Solicitacoes pendentes" value={metrics.pendingRequests} icon="inbox" hint="Status nova ou pendente" />
        <StatCard label="Avaliacao media" value={metrics.averageRating} icon="star" hint="Media das avaliacoes reais" />
        <StatCard label="Taxa de resposta" value={metrics.responseRate} icon="activity" hint="Solicitacoes respondidas" />
        <StatCard label="Tempo medio de resposta" value={metrics.averageResponseTime} icon="clock" hint="Primeira resposta ao desabafo" />
        <StatCard label="Pacientes ajudados" value={metrics.helpedPatients} icon="heart" hint="Pacientes finalizados" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-base font-semibold text-stone-950">Perfil profissional</h2>
              <p className="text-sm text-stone-500">Campos completos atualizam a barra automaticamente.</p>
            </div>
            <span className="badge border border-brand-100 bg-brand-50 text-brand-700">{completion}%</span>
          </div>
          <ProgressBar value={completion} />
          <ProfilePreview profile={profile} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Solicitacoes recentes</h2>
          {data.requests.length ? (
            <div className="space-y-3">
              {data.requests.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">{request.pacienteNome || 'Paciente anonimo'}</p>
                    <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{request.status || 'nova'}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{request.motivo || 'Sem motivo informado'}</p>
                  <p className="mt-2 text-xs text-stone-400">{formatDate(request.criadaEm)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="inbox" title="Nenhuma solicitacao" description="Quando pacientes solicitarem contato, os pedidos aparecem aqui." />
          )}
        </div>
      </section>
    </div>
  )
}

function ProfilePreview({ profile }) {
  const displayName = profile?.nome || 'Nome profissional nao informado'
  const areas = Array.isArray(profile?.areas) ? profile.areas : []

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-stone-50/90 p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-600 text-lg font-semibold text-stone-50 ring-4 ring-stone-100">
          {profile?.fotoUrl ? <img src={profile.fotoUrl} alt="" className="h-full w-full object-cover" /> : displayName.split(' ').map((item) => item[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-950">{displayName}</h3>
              <p className="text-sm font-medium text-brand-700">{profile?.especialidade || 'Especialidade nao informada'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {[profile?.crp, profile?.cidade && profile?.estado ? `${profile.cidade}, ${profile.estado}` : null].filter(Boolean).join(' - ') || 'Registro e localizacao pendentes'}
              </p>
            </div>
            <span className={`badge border ${profile?.verificado ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
              <Icon name={profile?.verificado ? 'check' : 'clock'} className="h-3 w-3" />
              {profile?.verificado ? 'Verificado' : 'Pendente'}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-stone-100/50 p-3">
              <p className="text-xs text-slate-400">Modalidade</p>
              <p className="text-sm font-semibold text-slate-800">{profile?.atendimento || 'Nao informada'}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-100/50 p-3">
              <p className="text-xs text-slate-400">Valor</p>
              <p className="text-sm font-semibold text-slate-800">{profile?.valorConsulta || 'Nao informado'}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-100/50 p-3">
              <p className="text-xs text-slate-400">Disponibilidade</p>
              <p className="text-sm font-semibold text-slate-800">{profile?.disponibilidade || 'Nao informada'}</p>
            </div>
          </div>

          {profile?.descricao && <p className="mt-4 text-sm leading-relaxed text-slate-600">{profile.descricao}</p>}
          {areas.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map((area) => <span key={area} className="badge border border-stone-200 bg-stone-100/70 text-stone-600">{area}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfilePage({ user, profile, onNavigate }) {
  const [draft, setDraft] = useState(profile || {})
  const [saveState, setSaveState] = useState('salvo')

  useEffect(() => {
    setDraft(profile || {})
  }, [profile])

  useEffect(() => {
    if (!user?.uid || !draft?.uid) return undefined
    setSaveState('salvando')
    const timer = window.setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          ...draft,
          areas: Array.isArray(draft.areas) ? draft.areas : arrayFromText(draft.areas || ''),
          idiomas: Array.isArray(draft.idiomas) ? draft.idiomas : arrayFromText(draft.idiomas || ''),
          atualizadoEm: serverTimestamp(),
        })
        setSaveState('salvo')
      } catch (error) {
        console.error(error)
        setSaveState('erro')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [draft, user?.uid])

  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const completion = profileCompletion(draft)

  return (
    <div>
      <SectionHeader
        title="Meu Perfil"
        description="Toda alteracao e salva automaticamente no documento do profissional em users."
        actions={[
          <button key="view" onClick={() => onNavigate('professionals')} className="btn-secondary gap-2"><Icon name="eye" />Visualizar como paciente</button>,
          <span key="state" className={`badge border ${saveState === 'erro' ? 'border-red-100 bg-red-50 text-red-700' : 'border-sage-100 bg-sage-50 text-sage-700'}`}>
            {saveState === 'salvando' ? 'Salvando...' : saveState === 'erro' ? 'Erro ao salvar' : 'Salvo'}
          </span>,
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <form className="card profile-form grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="label">Foto de perfil (URL)</label>
            <input className="input-field" value={draft.fotoUrl || ''} onChange={(e) => setField('fotoUrl', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Nome</label>
            <input className="input-field" value={draft.nome || ''} onChange={(e) => setField('nome', e.target.value)} />
          </div>
          <div>
            <label className="label">CRP / Registro Profissional</label>
            <input className="input-field" value={draft.crp || ''} onChange={(e) => setField('crp', e.target.value)} />
          </div>
          <div>
            <label className="label">Especialidade</label>
            <input className="input-field" value={draft.especialidade || ''} onChange={(e) => setField('especialidade', e.target.value)} />
          </div>
          <div>
            <label className="label">Areas de atuacao</label>
            <input className="input-field" value={textFromArray(draft.areas)} onChange={(e) => setField('areas', e.target.value)} placeholder="Separadas por virgula" />
          </div>
          <div>
            <label className="label">Idiomas</label>
            <input className="input-field" value={textFromArray(draft.idiomas)} onChange={(e) => setField('idiomas', e.target.value)} placeholder="Separados por virgula" />
          </div>
          <div>
            <label className="label">Formacao</label>
            <input className="input-field" value={draft.formacao || ''} onChange={(e) => setField('formacao', e.target.value)} />
          </div>
          <div>
            <label className="label">Experiencia</label>
            <input className="input-field" value={draft.experiencia || ''} onChange={(e) => setField('experiencia', e.target.value)} />
          </div>
          <div>
            <label className="label">Modalidade</label>
            <select className="input-field" value={draft.atendimento || ''} onChange={(e) => setField('atendimento', e.target.value)}>
              <option value="">Selecione</option>
              <option>Online</option>
              <option>Presencial</option>
              <option>Online e presencial</option>
            </select>
          </div>
          <div>
            <label className="label">Valor da consulta</label>
            <input className="input-field" value={draft.valorConsulta || ''} onChange={(e) => setField('valorConsulta', e.target.value)} placeholder="Ex: R$ 180,00" />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input-field" value={draft.cidade || ''} onChange={(e) => setField('cidade', e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <input className="input-field" value={draft.estado || ''} onChange={(e) => setField('estado', e.target.value)} />
          </div>
          <div>
            <label className="label">Disponibilidade</label>
            <input className="input-field" value={draft.disponibilidade || ''} onChange={(e) => setField('disponibilidade', e.target.value)} />
          </div>
          <div>
            <label className="label">Redes sociais</label>
            <input className="input-field" value={draft.redesSociais || ''} onChange={(e) => setField('redesSociais', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Certificacoes</label>
            <input className="input-field" value={draft.certificacoes || ''} onChange={(e) => setField('certificacoes', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Biografia</label>
            <textarea className="input-field" rows={5} value={draft.descricao || ''} onChange={(e) => setField('descricao', e.target.value)} />
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold text-stone-950">Progresso do perfil</h2>
              <span className="text-sm font-semibold text-brand-700">{completion}%</span>
            </div>
            <ProgressBar value={completion} />
          </div>
          <div className="card p-5">
            <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Preview do paciente</h2>
            <ProfilePreview profile={draft} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function RequestsPage({ requests }) {
  const [selected, setSelected] = useState(null)

  const updateStatus = async (request, status) => {
    await updateDoc(doc(db, 'requests', request.id), {
      status,
      respondidaEm: ['aceita', 'recusada'].includes(status) ? serverTimestamp() : request.respondidaEm || null,
      finalizadaEm: status === 'finalizada' ? serverTimestamp() : request.finalizadaEm || null,
      atualizadaEm: serverTimestamp(),
    })
  }

  return (
    <div>
      <SectionHeader title="Solicitacoes" description="Central real de pedidos de contato enviados pelos pacientes." />

      <section className="mb-6 grid gap-3 sm:grid-cols-5">
        {REQUEST_STATUS.map((status) => (
          <StatCard key={status} label={status} value={requests.filter((item) => (item.status || 'nova') === status).length} icon="inbox" />
        ))}
      </section>

      {requests.length ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-stone-950">{request.pacienteNome || 'Paciente anonimo'}</h2>
                    <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{request.status || 'nova'}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{request.motivo || 'Sem motivo informado'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-400">
                    <span>{formatDate(request.criadaEm)}</span>
                    <span>{request.categoria || 'Sem categoria'}</span>
                    <span>Espera: {timeAgo(request.criadaEm)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(request, 'aceita')} className="btn-primary px-3 py-2 text-xs">Aceitar</button>
                  <button onClick={() => updateStatus(request, 'recusada')} className="btn-secondary px-3 py-2 text-xs">Recusar</button>
                  <button onClick={() => setSelected(request)} className="btn-secondary px-3 py-2 text-xs">Detalhes</button>
                  <button onClick={() => updateStatus(request, 'finalizada')} className="btn-secondary px-3 py-2 text-xs">Finalizar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="inbox" title="Nenhuma solicitacao recebida" description="Quando um paciente usar o diretorio para solicitar contato, o documento sera gravado em requests e aparecera aqui." />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-lg bg-stone-50 p-6 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl text-stone-950">Detalhes da solicitacao</h3>
                <p className="text-sm text-stone-500">{selected.pacienteNome || 'Paciente anonimo'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost p-2"><Icon name="x" /></button>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-medium text-stone-700">Motivo</dt><dd className="text-stone-500">{selected.motivo || 'Nao informado'}</dd></div>
              <div><dt className="font-medium text-stone-700">Categoria</dt><dd className="text-stone-500">{selected.categoria || 'Nao informada'}</dd></div>
              <div><dt className="font-medium text-stone-700">Status</dt><dd className="text-stone-500">{selected.status || 'nova'}</dd></div>
              <div><dt className="font-medium text-stone-700">Criada em</dt><dd className="text-stone-500">{formatDate(selected.criadaEm)}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

function CommunityPage({ posts, savedIds, user }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')

  const filtered = posts.filter((post) => {
    const matchCategory = category === 'Todas' || post.categoria === category
    const matchSearch = !search || [post.conteudo, post.categoria].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const toggleSaved = async (post) => {
    const ref = doc(db, 'users', user.uid, 'savedPosts', post.id)
    if (savedIds.includes(post.id)) {
      await deleteDoc(ref)
      return
    }
    await setDoc(ref, { postId: post.id, salvoEm: serverTimestamp() })
  }

  return (
    <div>
      <SectionHeader title="Comunidade" description="Feed real de desabafos, interacoes, filtros e publicacoes salvas." />
      <div className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar no feed..." />
        </div>
        <select className="input-field md:w-56" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((post) => (
            <article key={post.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{post.categoria || 'Sem categoria'}</span>
                <span className="text-xs text-stone-400">{formatDate(post.criadoEm)}</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.conteudo}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-stone-100 pt-3 text-xs text-stone-500">
                <span className="flex items-center gap-1"><Icon name="heart" className="h-4 w-4" />{post.curtidas?.length || 0} curtidas</span>
                <span className="flex items-center gap-1"><Icon name="message" className="h-4 w-4" />{post.respostas?.length || 0} comentarios</span>
                <span className="flex items-center gap-1"><Icon name="activity" className="h-4 w-4" />{post.compartilhamentos || 0} compartilhamentos</span>
                <button onClick={() => toggleSaved(post)} className="ml-auto text-brand-700 hover:underline">
                  {savedIds.includes(post.id) ? 'Remover dos salvos' : 'Salvar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="message" title="Nenhuma publicacao encontrada" description="Nao ha informacoes reais para os filtros selecionados." />
      )}
    </div>
  )
}

function AnswerPage({ posts, user }) {
  const [category, setCategory] = useState('Todas')
  const [replyByPost, setReplyByPost] = useState({})

  const pending = posts.filter((post) => (post.respostas?.length || 0) === 0)
  const filtered = category === 'Todas' ? pending : pending.filter((post) => post.categoria === category)

  const sendReply = async (post) => {
    const text = replyByPost[post.id]?.trim()
    if (!text) return
    await updateDoc(doc(db, 'posts', post.id), {
      respostas: arrayUnion({
        id: `${user.uid}-${Date.now()}`,
        texto: text,
        autorUid: user.uid,
        autorNome: user.displayName || 'Profissional',
        criadaEm: new Date().toISOString(),
        tipoAutor: 'profissional',
      }),
      totalRespostas: increment(1),
      primeiraRespostaProfissionalEm: post.primeiraRespostaProfissionalEm || serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    })
    setReplyByPost((current) => ({ ...current, [post.id]: '' }))
  }

  return (
    <div>
      <SectionHeader title="Responder Desabafos" description="Mostra apenas desabafos reais sem respostas registradas." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${category === item ? 'border-brand-600 bg-brand-600 text-stone-50' : 'border-stone-200 bg-stone-50/80 text-stone-600 hover:border-brand-200 hover:text-brand-700'}`}>
            {item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="space-y-4">
          {filtered.map((post) => (
            <article key={post.id} className="card p-5">
              <div className="mb-3 flex flex-wrap gap-2 text-xs text-stone-400">
                <span>{formatDate(post.criadoEm)}</span>
                <span>{timeAgo(post.criadoEm)}</span>
                <span>{post.categoria || 'Sem categoria'}</span>
                <span>{post.prioridade || 'Prioridade nao definida'}</span>
                <span>{post.respostas?.length || 0} respostas</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{post.conteudo}</p>
              <textarea
                className="input-field mt-4"
                rows={3}
                value={replyByPost[post.id] || ''}
                onChange={(e) => setReplyByPost((current) => ({ ...current, [post.id]: e.target.value }))}
                placeholder="Responder com acolhimento..."
              />
              <div className="mt-3 flex justify-end">
                <button onClick={() => sendReply(post)} disabled={!replyByPost[post.id]?.trim()} className="btn-primary gap-2"><Icon name="message" />Responder</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="message" title="Nao ha desabafos aguardando resposta" description="Quando existirem publicacoes reais sem resposta, elas aparecem aqui." />
      )}
    </div>
  )
}

function ReviewsPage({ reviews }) {
  const averageRating = average(reviews.map((review) => Number(review.nota)))
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ label: `${star} estrelas`, value: reviews.filter((review) => Number(review.nota) === star).length }))

  return (
    <div>
      <SectionHeader title="Avaliacoes" description="Reputacao calculada diretamente da colecao reviews." />
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Nota media" value={averageRating ? averageRating.toFixed(1) : '0'} icon="star" />
        <StatCard label="Total de avaliacoes" value={reviews.length} icon="message" />
        <StatCard label="Comentarios recentes" value={reviews.filter((item) => item.comentario).length} icon="file" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Distribuicao por estrelas</h2>
          <SmallBarChart data={distribution} emptyText="Avaliacoes reais ainda nao foram registradas." />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Comentarios recentes</h2>
          {reviews.some((item) => item.comentario) ? (
            <div className="space-y-3">
              {reviews.filter((item) => item.comentario).slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-lg border border-stone-200 p-3">
                  <p className="text-sm text-stone-700">{review.comentario}</p>
                  <p className="mt-2 text-xs text-stone-400">{review.nota || 0} estrelas - {formatDate(review.criadaEm)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="star" title="Sem comentarios" description="Os comentarios aparecem aqui quando pacientes avaliarem atendimentos." />
          )}
        </div>
      </div>
    </div>
  )
}

function SchedulePage({ appointments, profile, user }) {
  const [availability, setAvailability] = useState(profile?.disponibilidade || '')
  const upcoming = appointments.filter((item) => !['concluida', 'finalizada', 'cancelada'].includes(item.status))

  useEffect(() => {
    setAvailability(profile?.disponibilidade || '')
  }, [profile?.disponibilidade])

  const saveAvailability = async () => {
    await updateDoc(doc(db, 'users', user.uid), { disponibilidade: availability, atualizadoEm: serverTimestamp() })
  }

  return (
    <div>
      <SectionHeader title="Agenda" description="Agenda real baseada na colecao appointments e na disponibilidade do perfil." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Disponibilidade semanal</h2>
          <textarea className="input-field" rows={6} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Ex: Segunda a sexta, 18h as 21h" />
          <button onClick={saveAvailability} className="btn-primary mt-3 w-full gap-2"><Icon name="save" />Editar horarios</button>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Proximos atendimentos</h2>
          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">{appointment.pacienteNome || 'Paciente anonimo'}</p>
                    <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{appointment.status || 'agendada'}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{formatDate(appointment.data)}</p>
                  <p className="text-xs text-stone-400">{appointment.modalidade || profile?.atendimento || 'Modalidade nao informada'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="calendar" title="Agenda vazia" description="Nenhum atendimento real foi encontrado em appointments para este profissional." />
          )}
        </div>
      </div>
    </div>
  )
}

function StatsPage({ data, metrics, user }) {
  const byCategory = CATEGORIES.filter((item) => item !== 'Todas').map((category) => ({
    label: category,
    value: data.posts.filter((post) => post.categoria === category && (post.respostas || []).some((response) => response.autorUid === user.uid)).length,
  }))
  const requestData = REQUEST_STATUS.map((status) => ({ label: status, value: data.requests.filter((item) => (item.status || 'nova') === status).length }))
  const weeklyResponses = [{ label: 'Respostas registradas', value: metrics.answeredMessages }]

  return (
    <div>
      <SectionHeader title="Estatisticas" description="Graficos exibem apenas dados reais; quando nao ha base suficiente, mostram estado vazio." />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Solicitacoes recebidas" value={data.requests.length} icon="inbox" />
        <StatCard label="Avaliacoes recebidas" value={data.reviews.length} icon="star" />
        <StatCard label="Novos pacientes" value={metrics.helpedPatients} icon="users" />
        <StatCard label="Respostas por semana" value={metrics.answeredMessages} icon="message" />
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Solicitacoes por status</h2>
          <SmallBarChart data={requestData} emptyText="Nenhuma solicitacao real foi registrada." />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Categorias atendidas</h2>
          <SmallBarChart data={byCategory} emptyText="Responda desabafos reais para gerar distribuicao por categoria." />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Atividade</h2>
          <SmallBarChart data={weeklyResponses} emptyText="Ainda nao ha respostas reais para calcular atividade." />
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ user, onNavigate }) {
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const changeEmail = async () => {
    await updateEmail(user, email)
    setMessage('E-mail atualizado.')
  }

  const changePassword = async () => {
    await updatePassword(user, password)
    setPassword('')
    setMessage('Senha atualizada.')
  }

  const deleteAccount = async () => {
    if (!window.confirm('Excluir sua conta permanentemente?')) return
    await deleteDoc(doc(db, 'users', user.uid))
    await deleteUser(user)
  }

  return (
    <div>
      <SectionHeader title="Configuracoes" description="Preferencias, seguranca e acoes de conta com execucao real no Firebase." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Dados da conta</h2>
          <label className="label">E-mail</label>
          <input className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={changeEmail} className="btn-primary mt-3 gap-2"><Icon name="save" />Alterar e-mail</button>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Seguranca</h2>
          <label className="label">Nova senha</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={changePassword} disabled={password.length < 6} className="btn-primary mt-3 gap-2"><Icon name="lock" />Alterar senha</button>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Preferencias e privacidade</h2>
          <p className="text-sm leading-relaxed text-stone-500">Notificacoes, privacidade, sessoes ativas e preferencias devem ser armazenadas no documento users quando a politica de produto definir os campos.</p>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Acoes da conta</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onNavigate('logout')} className="btn-secondary gap-2"><Icon name="logout" />Logout</button>
            <button onClick={deleteAccount} className="btn-secondary gap-2 text-red-600"><Icon name="trash" />Excluir conta</button>
          </div>
        </div>
      </div>
      {message && <div className="mt-4 rounded-lg border border-sage-100 bg-sage-50 px-4 py-3 text-sm text-sage-700">{message}</div>}
    </div>
  )
}

export default function ProfessionalHome({ user, profile, activePage = 'home', onNavigate }) {
  const data = useProfessionalData(user)
  const metrics = useMemo(() => buildMetrics(data, user?.uid), [data, user?.uid])

  const renderPage = useCallback(() => {
    switch (activePage) {
      case 'profile':
        return <ProfilePage user={user} profile={profile} onNavigate={onNavigate} />
      case 'requests':
        return <RequestsPage requests={data.requests} />
      case 'community':
        return <CommunityPage posts={data.posts} savedIds={data.savedIds} user={user} />
      case 'answer':
        return <AnswerPage posts={data.posts} user={user} />
      case 'reviews':
        return <ReviewsPage reviews={data.reviews} />
      case 'schedule':
        return <SchedulePage appointments={data.appointments} profile={profile} user={user} />
      case 'stats':
        return <StatsPage data={data} metrics={metrics} user={user} />
      case 'settings':
        return <SettingsPage user={user} onNavigate={onNavigate} />
      default:
        return <OverviewPage user={user} profile={profile} data={data} metrics={metrics} onNavigate={onNavigate} />
    }
  }, [activePage, data, metrics, onNavigate, profile, user])

  if (data.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-stone-200 bg-stone-50/80 p-4 shadow-soft">
            <div className="mb-5 h-8 w-8 rounded-lg bg-brand-100/70" />
            <div className="mb-3 h-5 w-20 rounded bg-slate-100/80" />
            <div className="h-3 w-28 rounded bg-slate-100/80" />
          </div>
        ))}
      </div>
    )
  }

  return <div className="space-y-6">{renderPage()}</div>
}
