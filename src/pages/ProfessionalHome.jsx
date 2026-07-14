import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDoc, deleteDoc, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, arrayUnion, collection, where, writeBatch } from 'firebase/firestore'
import { deleteUser, updateEmail, updatePassword } from 'firebase/auth'
import { db } from '../services/firebase'
import { moderarTexto } from '../services/ai'
import Icon from '../components/Icon'
import SessionChat from '../components/SessionChat'
import {
  AVAILABILITY_OPTIONS,
  CATEGORY_FILTERS,
  CERTIFICATION_OPTIONS,
  EXPERIENCE_OPTIONS,
  FORMATION_OPTIONS,
  LANGUAGE_OPTIONS,
  PROFESSIONAL_AREA_OPTIONS,
  REQUEST_STATUS,
  SERVICE_MODALITIES,
  SPECIALTY_OPTIONS,
} from '../constants/options'

const CATEGORIES = CATEGORY_FILTERS
const PROFILE_FIELDS = [
  'fotoUrl', 'nome', 'crp', 'especialidade', 'areas', 'formacao', 'experiencia', 'descricao',
  'atendimento', 'cidade', 'estado', 'valorConsulta', 'idiomas', 'disponibilidade', 'certificacoes',
]
const BIO_MAX_LENGTH = 600

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
  return number === null ? 'Nao informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function toDateTimeLocal(value) {
  const date = toDate(value)
  if (!date) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function toLocalDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function arrayFromText(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return arrayFromText(value)
  return []
}

function onlyAllowed(value, options) {
  return normalizeArray(value).filter((item) => options.includes(item))
}

function onlyAllowedSingle(value, options) {
  return options.includes(value) ? value : ''
}

function firstAllowed(value, options) {
  return onlyAllowed(value, options)[0] || ''
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

function StatCard({ label, value, icon, hint }) {
  const tone = STAT_TONES[icon] || {
    icon: 'border-brand-100 bg-brand-50 text-brand-700',
    glow: 'from-brand-500/0',
    bars: 'from-brand-500 to-brand-600',
    change: 'text-brand-700 bg-brand-50 border-brand-100',
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-stone-200 bg-stone-50/90 p-4 shadow-soft transition-colors duration-150">
      <div className="relative mb-4 flex items-center gap-3">
        <span className={`rounded-lg border p-2 shadow-sm ${tone.icon}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="text-3xl font-bold tracking-normal text-stone-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
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

function ProfileSelect({ label, value, options, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input-field" value={value || ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
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
  const nextAppointment = [...data.appointments]
    .filter((item) => !['concluida', 'finalizada', 'cancelada'].includes(item.status))
    .sort((a, b) => (toDate(a.data)?.getTime() || 0) - (toDate(b.data)?.getTime() || 0))[0]
  const newestRequest = [...data.requests]
    .sort((a, b) => (toDate(b.criadaEm)?.getTime() || 0) - (toDate(a.criadaEm)?.getTime() || 0))[0]
  const pendingProfileItems = PROFILE_FIELDS.filter((field) => {
    const value = profile?.[field]
    return Array.isArray(value) ? value.length === 0 : !value
  }).slice(0, 4)

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-brand-100 bg-brand-800 p-6 text-stone-50 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-50/15 bg-stone-50/10 px-3 py-1.5 text-xs font-medium text-brand-50">
              <Icon name="activity" className="h-3.5 w-3.5" />
              Painel profissional
            </span>
            <h1 className="font-sans text-3xl font-bold tracking-normal md:text-4xl">
              {profile?.nome || user?.displayName || 'Profissional'}, seu dia em uma tela.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-50/85">
              Acompanhe demanda, reputacao, agenda e pendencias do perfil sem depender de numeros ficticios.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('schedule')} className="rounded-lg border border-stone-50/15 bg-stone-50/10 p-4 text-left transition-colors hover:bg-stone-50/15">
              <Icon name="calendar" className="mb-3 h-5 w-5 text-brand-100" />
              <span className="block text-sm font-semibold">Abrir agenda</span>
              <span className="mt-1 block text-xs text-brand-50/75">{nextAppointment ? formatDate(nextAppointment.data) : 'Sem evento ativo'}</span>
            </button>
            <button onClick={() => onNavigate('requests')} className="rounded-lg border border-stone-50/15 bg-stone-50/10 p-4 text-left transition-colors hover:bg-stone-50/15">
              <Icon name="inbox" className="mb-3 h-5 w-5 text-brand-100" />
              <span className="block text-sm font-semibold">Solicitacoes</span>
              <span className="mt-1 block text-xs text-brand-50/75">{metrics.pendingRequests} aguardando</span>
            </button>
          </div>
        </div>
      </section>

      {data.error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Nao foi possivel carregar parte dos dados: {data.error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Agenda finalizada" value={metrics.completedAppointments} icon="users" hint="Consultas e solicitacoes finalizadas" />
        <StatCard label="Acessos ao perfil" value={metrics.profileViews} icon="eye" hint="Cliques reais no diretorio" />
        <StatCard label="Solicitacoes pendentes" value={metrics.pendingRequests} icon="inbox" hint="Status nova ou pendente" />
        <StatCard label="Avaliacao media" value={metrics.averageRating} icon="star" hint="Media das avaliacoes reais" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="card attention-panel p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-sans text-base font-semibold text-stone-950">Fila de atencao</h2>
              <p className="text-sm text-stone-500">O que merece resposta primeiro.</p>
            </div>
            <button onClick={() => onNavigate('requests')} className="btn-secondary px-3 py-2 text-xs">Ver tudo</button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="attention-item rounded-lg border border-stone-200 bg-stone-50/70 p-4">
              <div className="attention-title mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Icon name="calendar" />
                Proximo horario
              </div>
              <p className="text-sm text-stone-600">{nextAppointment ? nextAppointment.pacienteNome || 'Paciente anonimo' : 'Nada agendado'}</p>
              <p className="mt-1 text-xs text-stone-400">{nextAppointment ? formatDate(nextAppointment.data) : 'Selecione horarios na agenda.'}</p>
            </div>
            <div className="attention-item rounded-lg border border-stone-200 bg-stone-50/70 p-4">
              <div className="attention-title mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Icon name="inbox" />
                Pedido mais recente
              </div>
              <p className="text-sm text-stone-600">{newestRequest ? newestRequest.pacienteNome || 'Paciente anonimo' : 'Nenhum pedido novo'}</p>
              <p className="mt-1 line-clamp-2 text-xs text-stone-400">{newestRequest ? newestRequest.motivo || 'Sem motivo informado' : 'Pedidos aparecem quando usuarios solicitarem contato.'}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="attention-metric rounded-lg border border-stone-200 p-3">
              <p className="text-xs text-stone-400">Taxa resposta</p>
              <p className="mt-1 text-xl font-bold text-stone-900">{metrics.responseRate}</p>
            </div>
            <div className="attention-metric rounded-lg border border-stone-200 p-3">
              <p className="text-xs text-stone-400">Tempo medio</p>
              <p className="mt-1 text-xl font-bold text-stone-900">{metrics.averageResponseTime}</p>
            </div>
            <div className="attention-metric rounded-lg border border-stone-200 p-3">
              <p className="text-xs text-stone-400">Pacientes ajudados</p>
              <p className="mt-1 text-xl font-bold text-stone-900">{metrics.helpedPatients}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-sans text-base font-semibold text-stone-950">Perfil no diretorio</h2>
              <p className="text-sm text-stone-500">Impacta confianca e solicitacoes.</p>
            </div>
            <span className="badge border border-brand-100 bg-brand-50 text-brand-700">{completion}%</span>
          </div>
          <ProgressBar value={completion} />
          {pendingProfileItems.length ? (
            <div className="mt-4 space-y-2">
              {pendingProfileItems.map((field) => (
                <div key={field} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
                  <span className="capitalize text-stone-500">{field}</span>
                  <button onClick={() => onNavigate('profile')} className="text-xs font-medium text-brand-700 hover:underline">Completar</button>
                </div>
              ))}
            </div>
          ) : (
            <ProfilePreview profile={profile} />
          )}
        </div>
      </section>
    </div>
  )
}

function ProfilePreview({ profile }) {
  const displayName = profile?.nome || 'Nome profissional nao informado'
  const especialidade = onlyAllowedSingle(profile?.especialidade, SPECIALTY_OPTIONS)
  const areas = onlyAllowed(profile?.areas, PROFESSIONAL_AREA_OPTIONS)
  const certificacoes = onlyAllowed(profile?.certificacoes, CERTIFICATION_OPTIONS)
  const shouldShowValue = profile?.preferencias?.mostrarValorConsulta !== false
  const details = [
    { label: 'Modalidade', value: profile?.atendimento || 'Nao informada', icon: 'video' },
    { label: 'Valor', value: shouldShowValue ? formatMoney(profile?.valorConsulta) : 'Valor privado', icon: 'file' },
    { label: 'Disponibilidade', value: onlyAllowedSingle(profile?.disponibilidade, AVAILABILITY_OPTIONS) || 'Nao informada', icon: 'calendar' },
  ]

  return (
    <div className="profile-preview mt-5 overflow-hidden rounded-lg border border-stone-200 bg-stone-50/90 shadow-soft">
      <div className="profile-preview-header p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="mx-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-600 text-lg font-semibold text-stone-50 ring-4 ring-stone-100 sm:mx-0">
            {profile?.fotoUrl ? <img src={profile.fotoUrl} alt="" className="h-full w-full object-cover" /> : displayName.split(' ').map((item) => item[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{displayName}</h3>
                <p className="text-sm font-medium text-brand-700">{especialidade || 'Especialidade nao informada'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {[profile?.crp, profile?.cidade && profile?.estado ? `${profile.cidade}, ${profile.estado}` : null].filter(Boolean).join(' - ') || 'Registro e localizacao pendentes'}
                </p>
              </div>
              <span className={`badge mx-auto shrink-0 border sm:mx-0 ${profile?.verificado ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                <Icon name={profile?.verificado ? 'check' : 'clock'} className="h-3 w-3" />
                {profile?.verificado ? 'Verificado' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-stone-200 p-4">
        <div className="grid gap-2">
          {details.map((item) => (
            <div key={item.label} className="profile-preview-row flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-100/50 p-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-slate-400">{item.label}</span>
                <span className="block break-words text-sm font-semibold text-slate-800">{item.value}</span>
              </span>
            </div>
          ))}
        </div>

        {profile?.descricao && (
          <p className="line-clamp-4 text-sm leading-relaxed text-slate-600">{profile.descricao}</p>
        )}

        {areas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {areas.slice(0, 6).map((area) => <span key={area} className="profile-preview-chip badge border border-stone-200 bg-stone-100/70 text-stone-600">{area}</span>)}
            {areas.length > 6 && <span className="profile-preview-chip badge border border-stone-200 bg-stone-100/70 text-stone-600">+{areas.length - 6}</span>}
          </div>
        )}

        {certificacoes.length > 0 && (
          <div className="border-t border-stone-200 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-normal text-slate-400">Certificacoes</p>
            <div className="flex flex-wrap gap-2">
              {certificacoes.slice(0, 5).map((item) => <span key={item} className="profile-preview-chip badge border border-stone-200 bg-stone-100/70 text-stone-600">{item}</span>)}
              {certificacoes.length > 5 && <span className="profile-preview-chip badge border border-stone-200 bg-stone-100/70 text-stone-600">+{certificacoes.length - 5}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileProgressCard({ completion, onNavigate }) {
  const isComplete = completion >= 100

  if (isComplete) {
    return (
      <div className="profile-complete-card overflow-hidden rounded-lg border border-sage-100 bg-sage-50 p-5">
        <div className="flex items-start gap-3">
          <span className="profile-complete-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-600 text-white">
            <Icon name="award" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-sans text-base font-semibold text-stone-950">Perfil completo</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">
              Seu perfil ja pode aparecer bem apresentado para pacientes. Agora voce pode revisar a privacidade ou visualizar como ele fica no diretorio.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onNavigate('professionals')} className="btn-primary justify-center gap-2">
            <Icon name="eye" />Ver preview
          </button>
          <button type="button" onClick={() => onNavigate('settings')} className="btn-secondary justify-center gap-2">
            <Icon name="lock" />Privacidade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-sans text-base font-semibold text-stone-950">Progresso do perfil</h2>
        <span className="text-sm font-semibold text-brand-700">{completion}%</span>
      </div>
      <ProgressBar value={completion} />
      <p className="mt-3 text-xs leading-relaxed text-stone-500">
        Complete os campos principais para liberar um perfil mais confiavel no diretorio.
      </p>
    </div>
  )
}

function ProfilePage({ user, profile, onNavigate }) {
  const [draft, setDraft] = useState(profile || {})
  const [saveState, setSaveState] = useState('salvo')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    setDraft(profile || {})
  }, [profile])

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!user?.uid) return

    const valorConsulta = normalizeMoney(draft.valorConsulta)
    if (draft.valorConsulta && valorConsulta === null) {
      setSaveState('erro')
      setSaveMessage('Informe um valor de consulta valido.')
      return
    }

    setSaveState('salvando')
    setSaveMessage('')
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...draft,
        uid: user.uid,
        email: user.email || draft.email || '',
        tipo: 'profissional',
        especialidade: onlyAllowedSingle(draft.especialidade, SPECIALTY_OPTIONS),
        formacao: onlyAllowedSingle(draft.formacao, FORMATION_OPTIONS),
        experiencia: onlyAllowedSingle(draft.experiencia, EXPERIENCE_OPTIONS),
        disponibilidade: onlyAllowedSingle(draft.disponibilidade, AVAILABILITY_OPTIONS),
        descricao: String(draft.descricao || '').slice(0, BIO_MAX_LENGTH),
        valorConsulta,
        areas: onlyAllowed(draft.areas, PROFESSIONAL_AREA_OPTIONS),
        idiomas: onlyAllowed(draft.idiomas, LANGUAGE_OPTIONS),
        certificacoes: onlyAllowed(draft.certificacoes, CERTIFICATION_OPTIONS),
        atualizadoEm: serverTimestamp(),
      }, { merge: true })
      setSaveState('salvo')
      setSaveMessage('Perfil salvo com sucesso.')
    } catch (error) {
      console.error('Erro ao salvar perfil profissional:', error)
      setSaveState('erro')
      setSaveMessage(error.message || 'Nao foi possivel salvar o perfil.')
    } finally {
      window.setTimeout(() => setSaveMessage(''), 3500)
    }
  }

  const setField = (field, value) => {
    setSaveState('editando')
    setSaveMessage('')
    setDraft((current) => ({ ...current, [field]: value }))
  }
  const completion = profileCompletion(draft)
  const selectedEspecialidade = onlyAllowedSingle(draft.especialidade, SPECIALTY_OPTIONS)
  const selectedFormacao = onlyAllowedSingle(draft.formacao, FORMATION_OPTIONS)
  const selectedExperiencia = onlyAllowedSingle(draft.experiencia, EXPERIENCE_OPTIONS)
  const selectedArea = firstAllowed(draft.areas, PROFESSIONAL_AREA_OPTIONS)
  const selectedIdioma = firstAllowed(draft.idiomas, LANGUAGE_OPTIONS)
  const selectedCertificacao = firstAllowed(draft.certificacoes, CERTIFICATION_OPTIONS)
  const selectedDisponibilidade = onlyAllowedSingle(draft.disponibilidade, AVAILABILITY_OPTIONS)
  const bioValue = String(draft.descricao || '').slice(0, BIO_MAX_LENGTH)

  return (
    <div>
      <SectionHeader
        title="Meu Perfil"
        description="As alteracoes sao salvas no documento do profissional em users."
        actions={[
          <button key="view" onClick={() => onNavigate('professionals')} className="btn-secondary gap-2"><Icon name="eye" />Visualizar como paciente</button>,
          <span key="state" className={`badge border ${saveState === 'erro' ? 'border-red-100 bg-red-50 text-red-700' : 'border-sage-100 bg-sage-50 text-sage-700'}`}>
            {saveState === 'salvando' ? 'Salvando...' : saveState === 'erro' ? 'Erro ao salvar' : saveState === 'editando' ? 'Alteracoes pendentes' : 'Salvo'}
          </span>,
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <form onSubmit={saveProfile} className="card profile-form grid gap-4 p-5 sm:grid-cols-2">
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
            <select className="input-field" value={selectedEspecialidade} onChange={(e) => setField('especialidade', e.target.value)}>
              <option value="">Selecione</option>
              {SPECIALTY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <ProfileSelect label="Areas de atuacao" value={selectedArea} options={PROFESSIONAL_AREA_OPTIONS} onChange={(next) => setField('areas', next ? [next] : [])} />
          </div>
          <div>
            <ProfileSelect label="Idiomas" value={selectedIdioma} options={LANGUAGE_OPTIONS} onChange={(next) => setField('idiomas', next ? [next] : [])} />
          </div>
          <div>
            <label className="label">Formacao</label>
            <select className="input-field" value={selectedFormacao} onChange={(e) => setField('formacao', e.target.value)}>
              <option value="">Selecione</option>
              {FORMATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Experiencia</label>
            <select className="input-field" value={selectedExperiencia} onChange={(e) => setField('experiencia', e.target.value)}>
              <option value="">Selecione</option>
              {EXPERIENCE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
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
            <input type="number" min="0" step="0.01" className="input-field" value={draft.valorConsulta ?? ''} onChange={(e) => setField('valorConsulta', e.target.value)} placeholder="Ex: 180,00" />
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
            <select className="input-field" value={selectedDisponibilidade} onChange={(e) => setField('disponibilidade', e.target.value)}>
              <option value="">Selecione</option>
              {AVAILABILITY_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Redes sociais</label>
            <input className="input-field" value={draft.redesSociais || ''} onChange={(e) => setField('redesSociais', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <ProfileSelect label="Certificacoes" value={selectedCertificacao} options={CERTIFICATION_OPTIONS} onChange={(next) => setField('certificacoes', next ? [next] : [])} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Biografia</label>
            <textarea
              className="input-field"
              rows={5}
              maxLength={BIO_MAX_LENGTH}
              value={bioValue}
              onChange={(e) => setField('descricao', e.target.value.slice(0, BIO_MAX_LENGTH))}
              placeholder="Conte brevemente sua abordagem e forma de atendimento."
            />
            <p className="mt-1.5 text-right text-xs text-stone-400">{bioValue.length}/{BIO_MAX_LENGTH}</p>
          </div>
          {saveMessage && (
            <div className={`sm:col-span-2 rounded-lg border px-4 py-3 text-sm ${saveState === 'erro' ? 'border-red-100 bg-red-50 text-red-700' : 'border-sage-100 bg-sage-50 text-sage-700'}`}>
              {saveMessage}
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={saveState === 'salvando'} className="btn-primary gap-2">
              <Icon name="save" />
              {saveState === 'salvando' ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <ProfileProgressCard completion={completion} onNavigate={onNavigate} />
          <div className="card p-5">
            <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Preview do paciente</h2>
            <ProfilePreview profile={draft} />
          </div>
        </aside>
      </div>
    </div>
  )
}

function RequestsPage({ requests, user, profile }) {
  const [selected, setSelected] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [scheduleByRequest, setScheduleByRequest] = useState({})
  const activeRequests = requests.filter((request) => ['nova', 'pendente'].includes(request.status || 'nova'))
  const historyRequests = requests.filter((request) => !['nova', 'pendente'].includes(request.status || 'nova'))
  const statusClass = (status) => `request-status request-status-${status || 'nova'}`

  const updateStatus = async (request, status) => {
    const scheduledAt = scheduleByRequest[request.id]
    if (status === 'aceita' && !scheduledAt) {
      setMessage('Escolha data e hora para aceitar e criar o atendimento na agenda.')
      return
    }
    if (status === 'aceita' && toDate(scheduledAt)?.getTime() < Date.now() - 60000) {
      setMessage('Escolha uma data e hora futura para aceitar a solicitacao.')
      return
    }

    setBusyId(`${request.id}-${status}`)
    setMessage('')
    try {
      let appointmentId = request.appointmentId || ''
      const batch = writeBatch(db)
      if (status === 'aceita' && scheduledAt && !appointmentId) {
        const appointmentRef = doc(collection(db, 'appointments'))
        appointmentId = appointmentRef.id
        batch.set(appointmentRef, {
          profissionalUid: user.uid,
          profissionalNome: profile?.nome || user.displayName || request.profissionalNome || 'Profissional',
          requestId: request.id,
          pacienteUid: request.pacienteUid || '',
          pacienteNome: request.pacienteNome || 'Paciente anonimo',
          data: new Date(scheduledAt).toISOString(),
          modalidade: profile?.atendimento || 'Online',
          status: 'agendada',
          observacoes: request.motivo || '',
          criadaEm: serverTimestamp(),
          atualizadaEm: serverTimestamp(),
        })
      }

      batch.update(doc(db, 'requests', request.id), {
        status,
        appointmentId,
        agendadaPara: status === 'aceita' && scheduledAt ? new Date(scheduledAt).toISOString() : request.agendadaPara || null,
        respondidaEm: ['aceita', 'recusada'].includes(status) ? serverTimestamp() : request.respondidaEm || null,
        finalizadaEm: status === 'finalizada' ? serverTimestamp() : request.finalizadaEm || null,
        atualizadaEm: serverTimestamp(),
      })
      await batch.commit()
      setMessage('Solicitacao atualizada com sucesso.')
      setScheduleByRequest((current) => ({ ...current, [request.id]: '' }))
      if (selected?.id === request.id) setSelected((current) => ({ ...current, status }))
    } catch (error) {
      console.error('Erro ao atualizar solicitacao:', error)
      setMessage(error.message || 'Nao foi possivel atualizar a solicitacao.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="experience-page">
      <SectionHeader title="Solicitacoes" description="Pedidos de contato entram aqui como uma triagem acolhedora antes do atendimento." />
      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.includes('sucesso') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <section className="experience-hero mb-6">
        <div className="experience-hero-main">
          <span className="experience-kicker">Central de acolhimento</span>
          <h2>Fila de chegada</h2>
          <p>Pedidos novos entram como uma triagem rapida: entenda o motivo, aceite o atendimento ou envie para o historico.</p>
        </div>
        <div className="experience-hero-number">
          <span>agora</span>
          <strong>{activeRequests.length}</strong>
          <p>aguardando resposta</p>
        </div>
        <div className="experience-pill-list">
          {REQUEST_STATUS.map((status) => (
            <span key={status}>{status}: {requests.filter((item) => (item.status || 'nova') === status).length}</span>
          ))}
        </div>
      </section>

      {activeRequests.length ? (
        <div className="request-river">
          {activeRequests.map((request) => (
            <article key={request.id} className="request-ticket request-card request-card-active">
              <div className="request-ticket-glow" />
              <div className="request-ticket-body">
                <div className="flex items-start gap-4">
                  <div className="request-avatar">
                    {(request.pacienteNome || 'P').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-stone-950">{request.pacienteNome || 'Paciente anonimo'}</h2>
                      <span className={`badge border border-stone-200 bg-stone-50 text-stone-600 ${statusClass(request.status)}`}>{request.status || 'nova'}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-stone-600">{request.motivo || 'Sem motivo informado'}</p>
                    <div className="request-meta-strip mt-4">
                      <span><Icon name="clock" className="h-3.5 w-3.5" />{timeAgo(request.criadaEm)}</span>
                      <span><Icon name="filter" className="h-3.5 w-3.5" />{request.categoria || 'Sem categoria'}</span>
                      <span><Icon name="calendar" className="h-3.5 w-3.5" />{formatDate(request.criadaEm)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="request-ticket-actions">
                <label className="text-[11px] font-semibold uppercase tracking-normal text-stone-500">
                  Data do atendimento
                  <input
                    type="datetime-local"
                    className="input-field mt-1 min-h-9 px-2 py-1 text-xs"
                    value={scheduleByRequest[request.id] || ''}
                    onChange={(event) => setScheduleByRequest((current) => ({ ...current, [request.id]: event.target.value }))}
                  />
                </label>
                <button onClick={() => updateStatus(request, 'aceita')} disabled={Boolean(busyId)} className="btn-primary px-3 py-2 text-xs">{busyId === `${request.id}-aceita` ? 'Salvando...' : 'Aceitar'}</button>
                <button onClick={() => updateStatus(request, 'recusada')} disabled={Boolean(busyId)} className="btn-secondary px-3 py-2 text-xs">{busyId === `${request.id}-recusada` ? 'Salvando...' : 'Recusar'}</button>
                <button onClick={() => setSelected(request)} className="btn-secondary px-3 py-2 text-xs">Detalhes</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon="inbox" title="Nenhuma solicitacao pendente" description="Ao aceitar, recusar ou finalizar, o pedido sai desta fila e vai para o historico." />
      )}

      {historyRequests.length > 0 && (
        <section className="history-dock mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-stone-950">Historico</h2>
              <p className="text-sm text-stone-500">Solicitacoes ja respondidas ficam em uma linha compacta de consulta.</p>
            </div>
            <span className="badge request-count border border-stone-200 bg-stone-50 text-stone-600">{historyRequests.length}</span>
          </div>
          <div className="history-dock-list">
            {historyRequests.map((request) => (
              <article key={request.id} className="history-chip request-card request-card-history">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-stone-900">{request.pacienteNome || 'Paciente anonimo'}</h3>
                    <span className={`badge border border-stone-200 bg-stone-50 text-stone-600 ${statusClass(request.status)}`}>{request.status || 'nova'}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{request.motivo || 'Sem motivo informado'}</p>
                  <p className="mt-2 text-xs text-stone-400">{formatDate(request.atualizadaEm || request.respondidaEm || request.finalizadaEm || request.criadaEm)}</p>
                </div>
                <button onClick={() => setSelected(request)} className="btn-secondary px-3 py-2 text-xs">Abrir</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="request-modal detail-sheet w-full max-w-lg bg-stone-50 p-6 shadow-card">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <span className="experience-kicker">detalhes</span>
                <h3 className="font-serif text-2xl text-stone-950">Solicitacao</h3>
                <p className="text-sm text-stone-500">{selected.pacienteNome || 'Paciente anonimo'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost p-2"><Icon name="x" /></button>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="font-medium text-stone-700">Motivo</dt><dd className="text-stone-500">{selected.motivo || 'Nao informado'}</dd></div>
              <div><dt className="font-medium text-stone-700">Categoria</dt><dd className="text-stone-500">{selected.categoria || 'Nao informada'}</dd></div>
              <div><dt className="font-medium text-stone-700">Status</dt><dd className="text-stone-500"><span className={`badge border border-stone-200 bg-stone-50 text-stone-600 ${statusClass(selected.status)}`}>{selected.status || 'nova'}</span></dd></div>
              <div><dt className="font-medium text-stone-700">Criada em</dt><dd className="text-stone-500">{formatDate(selected.criadaEm)}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionsPage({ requests, user }) {
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const acceptedRequests = requests
    .filter((request) => request.status === 'aceita')
    .sort((a, b) => (toDate(b.respondidaEm || b.atualizadaEm || b.criadaEm)?.getTime() || 0) - (toDate(a.respondidaEm || a.atualizadaEm || a.criadaEm)?.getTime() || 0))
  const finalizedRequests = requests
    .filter((request) => request.status === 'finalizada')
    .sort((a, b) => (toDate(b.finalizadaEm || b.atualizadaEm || b.criadaEm)?.getTime() || 0) - (toDate(a.finalizadaEm || a.atualizadaEm || a.criadaEm)?.getTime() || 0))
  const selectedSession = acceptedRequests.find((request) => request.id === selectedId) || acceptedRequests[0] || null

  useEffect(() => {
    if (!acceptedRequests.length) {
      setSelectedId('')
      return
    }
    if (!acceptedRequests.some((request) => request.id === selectedId)) {
      setSelectedId(acceptedRequests[0].id)
    }
  }, [acceptedRequests, selectedId])

  const finishSession = async (request) => {
    setBusyId(request.id)
    setMessage('')
    try {
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'finalizada',
        finalizadaEm: serverTimestamp(),
        atualizadaEm: serverTimestamp(),
      })
      setMessage('Atendimento finalizado. O paciente ja pode avaliar.')
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error)
      setMessage(error.message || 'Nao foi possivel finalizar o atendimento.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="experience-page">
      <SectionHeader
        title="Atendimentos"
        description="Solicitacoes aceitas ficam aqui para voce acompanhar e finalizar quando o atendimento terminar."
      />

      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.includes('finalizado') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <section className="session-hero mb-6">
        <div>
          <span className="experience-kicker">Sala em tempo real</span>
          <h2>Atendimentos ativos</h2>
          <p>Selecione uma pessoa na lateral, acompanhe o chat e finalize quando o ciclo estiver concluido.</p>
        </div>
        <div className="session-hero-metrics">
          <span><strong>{acceptedRequests.length}</strong> ativos</span>
          <span><strong>{finalizedRequests.length}</strong> finalizados</span>
          <span><strong>{selectedSession ? '1' : '0'}</strong> chat aberto</span>
        </div>
      </section>

      {acceptedRequests.length ? (
        <div className="session-studio">
          <aside className="session-patient-rail">
            <div className="mb-3 px-1">
              <span className="experience-kicker">pacientes</span>
            </div>
            {acceptedRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => setSelectedId(request.id)}
                className={`session-patient-card ${selectedSession?.id === request.id ? 'active' : ''}`}
              >
                <span className="request-avatar">
                  {(request.pacienteNome || 'P').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <strong>{request.pacienteNome || 'Paciente anonimo'}</strong>
                  <small>{request.categoria || 'Sem categoria'}</small>
                </span>
                <Icon name="chevronRight" className="h-4 w-4 shrink-0" />
              </button>
            ))}
          </aside>
          <section className="session-workbench">
            {selectedSession && (
              <div className="session-workbench-header">
                <div>
                  <span className="experience-kicker">atendimento selecionado</span>
                  <h2>{selectedSession.pacienteNome || 'Paciente anonimo'}</h2>
                  <p>{selectedSession.motivo || 'Sem motivo informado'}</p>
                </div>
                <button onClick={() => finishSession(selectedSession)} disabled={busyId === selectedSession.id} className="btn-primary shrink-0 px-3 py-2 text-xs">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  {busyId === selectedSession.id ? 'Finalizando...' : 'Finalizar'}
                </button>
              </div>
            )}
            <SessionChat session={selectedSession} user={user} role="profissional" />
          </section>
        </div>
      ) : (
        <EmptyState icon="heart" title="Nenhum atendimento em aberto" description="Quando voce aceitar uma solicitacao, ela aparece aqui para acompanhamento." />
      )}

      {finalizedRequests.length > 0 && (
        <section className="history-dock mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-stone-950">Finalizados</h2>
              <p className="text-sm text-stone-500">Atendimentos finalizados liberam avaliacao para o paciente.</p>
            </div>
            <span className="badge request-count border border-stone-200 bg-stone-50 text-stone-600">{finalizedRequests.length}</span>
          </div>
          <div className="history-dock-list">
            {finalizedRequests.slice(0, 8).map((request) => (
              <article key={request.id} className="history-chip request-card request-card-history">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-stone-900">{request.pacienteNome || 'Paciente anonimo'}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-500">{request.motivo || 'Sem motivo informado'}</p>
                  </div>
                  <span className="text-xs text-stone-400">{formatDate(request.finalizadaEm || request.atualizadaEm)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CommunityPage({ posts, savedIds, user }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [message, setMessage] = useState('')

  const filtered = posts.filter((post) => {
    const matchCategory = category === 'Todas' || post.categoria === category
    const matchSearch = !search || [post.conteudo, post.categoria].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const toggleSaved = async (post) => {
    setMessage('')
    try {
      const ref = doc(db, 'users', user.uid, 'savedPosts', post.id)
      if (savedIds.includes(post.id)) {
        await deleteDoc(ref)
        setMessage('Publicacao removida dos salvos.')
        return
      }
      await setDoc(ref, { postId: post.id, salvoEm: serverTimestamp() })
      setMessage('Publicacao salva com sucesso.')
    } catch (error) {
      console.error('Erro ao atualizar salvos:', error)
      setMessage(error.message || 'Nao foi possivel atualizar os salvos.')
    }
  }

  return (
    <div className="experience-page community-lounge">
      <SectionHeader title="Comunidade" description="Feed real de desabafos, interacoes, filtros e publicacoes salvas." />
      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.includes('sucesso') || message.includes('removida') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <section className="community-editorial mb-6">
        <div>
          <span className="experience-kicker">mural vivo</span>
          <h2>Escuta da comunidade</h2>
          <p>Use a busca e as categorias para encontrar temas, salvar relatos importantes e acompanhar sinais de acolhimento.</p>
        </div>
        <div className="community-search-panel">
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar no feed..." />
          </div>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      {filtered.length ? (
        <div className="community-mosaic">
          {filtered.map((post) => (
            <article key={post.id} className="community-note community-post">
              <div className="community-note-pin" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <span className="badge community-badge border border-stone-200 bg-stone-50 text-stone-600">{post.categoria || 'Sem categoria'}</span>
                  <p className="mt-2 text-xs text-stone-400">{formatDate(post.criadoEm)}</p>
                </div>
                <button onClick={() => toggleSaved(post)} className="community-save-button">
                  <Icon name="save" className="h-3.5 w-3.5" />
                  {savedIds.includes(post.id) ? 'Salvo' : 'Salvar'}
                </button>
              </div>
              <p className="community-story-text whitespace-pre-line text-base leading-relaxed text-stone-700">{post.conteudo}</p>
              <div className="community-note-footer">
                <span><Icon name="heart" className="h-4 w-4" />{post.curtidas?.length || 0}</span>
                <span><Icon name="message" className="h-4 w-4" />{post.respostas?.length || 0}</span>
                <span><Icon name="activity" className="h-4 w-4" />{post.compartilhamentos || 0}</span>
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
  const [sendingId, setSendingId] = useState('')
  const [message, setMessage] = useState('')

  const pending = posts.filter((post) => (post.respostas?.length || 0) === 0 && post.autorUid !== user?.uid)
  const filtered = category === 'Todas' ? pending : pending.filter((post) => post.categoria === category)

  const sendReply = async (post) => {
    const text = replyByPost[post.id]?.trim()
    if (!text) return
    if (post.autorUid === user?.uid) {
      setMessage('Voce nao pode responder seu proprio desabafo.')
      return
    }
    setSendingId(post.id)
    setMessage('')
    try {
      const moderacao = await moderarTexto(text)
      if (!moderacao.ok) {
        setMessage(`Resposta nao permitida: ${moderacao.motivo}`)
        return
      }
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
      setMessage('Resposta enviada com sucesso.')
    } catch (error) {
      console.error('Erro ao enviar resposta profissional:', error)
      setMessage(error.message || 'Nao foi possivel enviar a resposta.')
    } finally {
      setSendingId('')
    }
  }

  return (
    <div>
      <SectionHeader title="Responder Desabafos" description="Mostra apenas desabafos reais sem respostas registradas." />
      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.includes('sucesso') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
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
                <button onClick={() => sendReply(post)} disabled={!replyByPost[post.id]?.trim() || Boolean(sendingId)} className="btn-primary gap-2"><Icon name="message" />{sendingId === post.id ? 'Enviando...' : 'Responder'}</button>
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
  const normalizedReviews = reviews
    .map((review) => ({ ...review, nota: normalizeRating(review.nota) }))
    .filter((review) => review.nota !== null)
  const averageRating = average(normalizedReviews.map((review) => review.nota))
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ label: `${star} estrelas`, value: normalizedReviews.filter((review) => review.nota === star).length }))

  return (
    <div className="experience-page review-lounge">
      <SectionHeader title="Avaliacoes" description="Somente usuarios podem avaliar profissionais. Aqui voce acompanha a reputacao recebida." />
      <section className="review-radar mb-6">
        <div className="review-score-main">
          <span>reputacao recebida</span>
          <strong>{averageRating ? averageRating.toFixed(1) : '0'}</strong>
          <p>{normalizedReviews.length} avaliacao(oes) de atendimentos finalizados</p>
        </div>
        <div className="review-radar-stat"><span>Total</span><strong>{normalizedReviews.length}</strong></div>
        <div className="review-radar-stat"><span>Comentarios</span><strong>{normalizedReviews.filter((item) => item.comentario).length}</strong></div>
      </section>
      <div className="review-grid">
        <div className="review-panel review-chart-panel card p-5">
          <div className="mb-4">
            <span className="experience-kicker">distribuicao</span>
            <h2 className="font-sans text-base font-semibold text-stone-950">Notas por estrelas</h2>
          </div>
          <SmallBarChart data={distribution} emptyText="Avaliacoes reais ainda nao foram registradas." />
        </div>
        <div className="review-panel review-testimonial-panel card p-5">
          <div className="mb-4">
            <span className="experience-kicker">depoimentos</span>
            <h2 className="font-sans text-base font-semibold text-stone-950">Comentarios recentes</h2>
          </div>
          {normalizedReviews.some((item) => item.comentario) ? (
            <div className="review-testimonial-stack">
              {normalizedReviews.filter((item) => item.comentario).slice(0, 5).map((review) => (
                <div key={review.id} className="review-comment-row border border-stone-200 p-4">
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

function SchedulePage({ appointments, requests, profile, user }) {
  const [availability, setAvailability] = useState(profile?.disponibilidade || '')
  const [appointmentForm, setAppointmentForm] = useState({
    id: '',
    requestId: '',
    pacienteUid: '',
    pacienteNome: '',
    data: '',
    modalidade: profile?.atendimento || 'Online',
    status: 'agendada',
    observacoes: '',
  })
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [savingAppointment, setSavingAppointment] = useState(false)
  const [message, setMessage] = useState('')
  const acceptedRequests = requests
    .filter((request) => request.status === 'aceita')
    .sort((a, b) => (toDate(b.respondidaEm || b.atualizadaEm || b.criadaEm)?.getTime() || 0) - (toDate(a.respondidaEm || a.atualizadaEm || a.criadaEm)?.getTime() || 0))
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = toDate(a.data)?.getTime() || 0
    const dateB = toDate(b.data)?.getTime() || 0
    return dateA - dateB
  })
  const upcoming = sortedAppointments.filter((item) => !['concluida', 'finalizada', 'cancelada'].includes(item.status))
  const scheduleDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + index)
    return date
  })
  const scheduleHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

  const slotKey = (date, hour) => `${toLocalDateInput(date)}T${hour}`
  const appointmentSlotKey = (appointment) => {
    const date = toDate(appointment.data)
    if (!date) return ''
    return `${toLocalDateInput(date)}T${String(date.getHours()).padStart(2, '0')}:00`
  }
  const appointmentBySlot = new Map(
    upcoming.map((appointment) => [appointmentSlotKey(appointment), appointment])
  )

  useEffect(() => {
    setAvailability(profile?.disponibilidade || '')
  }, [profile?.disponibilidade])

  const selectSlot = (date, hour) => {
    const existing = appointmentBySlot.get(slotKey(date, hour))
    if (existing) {
      editAppointment(existing)
      return
    }
    setAppointmentForm((current) => ({
      ...current,
      id: '',
      requestId: current.requestId || '',
      data: `${toLocalDateInput(date)}T${hour}`,
      status: 'agendada',
      modalidade: current.modalidade || profile?.atendimento || 'Online',
    }))
  }

  const saveAvailability = async () => {
    setSavingAvailability(true)
    setMessage('')
    try {
      await updateDoc(doc(db, 'users', user.uid), { disponibilidade: availability, atualizadoEm: serverTimestamp() })
      setMessage('Disponibilidade salva com sucesso.')
    } catch (error) {
      console.error('Erro ao salvar disponibilidade:', error)
      setMessage(error.message || 'Nao foi possivel salvar a disponibilidade.')
    } finally {
      setSavingAvailability(false)
    }
  }

  const resetAppointmentForm = () => {
    setAppointmentForm({
      id: '',
      requestId: '',
      pacienteUid: '',
      pacienteNome: '',
      data: '',
      modalidade: profile?.atendimento || 'Online',
      status: 'agendada',
      observacoes: '',
    })
  }

  const selectRequest = (requestId) => {
    const request = acceptedRequests.find((item) => item.id === requestId)
    setAppointmentForm((current) => ({
      ...current,
      requestId,
      pacienteUid: request?.pacienteUid || '',
      pacienteNome: request?.pacienteNome || '',
      observacoes: request && !current.observacoes ? request.motivo || '' : current.observacoes,
    }))
  }

  const saveAppointment = async (event) => {
    event.preventDefault()
    if (!user?.uid || !appointmentForm.data) {
      setMessage('Informe pelo menos data e horario do atendimento.')
      return
    }

    setSavingAppointment(true)
    setMessage('')
    try {
      const nextDate = new Date(appointmentForm.data)
      const nextKey = `${toLocalDateInput(nextDate)}T${String(nextDate.getHours()).padStart(2, '0')}:00`
      const conflict = appointmentBySlot.get(nextKey)
      if (conflict && conflict.id !== appointmentForm.id) {
        setMessage('Ja existe um evento nesse horario. Escolha outro horario ou edite o evento existente.')
        return
      }

      const payload = {
        profissionalUid: user.uid,
        profissionalNome: profile?.nome || user.displayName || 'Profissional',
        requestId: appointmentForm.requestId || '',
        pacienteUid: appointmentForm.pacienteUid || '',
        pacienteNome: appointmentForm.pacienteNome || 'Paciente anonimo',
        data: nextDate.toISOString(),
        modalidade: appointmentForm.modalidade || profile?.atendimento || 'Online',
        status: appointmentForm.status || 'agendada',
        observacoes: appointmentForm.observacoes || '',
        atualizadaEm: serverTimestamp(),
      }

      if (appointmentForm.id) {
        await updateDoc(doc(db, 'appointments', appointmentForm.id), payload)
        setMessage('Atendimento atualizado com sucesso.')
      } else {
        await addDoc(collection(db, 'appointments'), {
          ...payload,
          criadaEm: serverTimestamp(),
        })
        setMessage('Atendimento criado com sucesso.')
      }
      if (payload.requestId && ['concluida', 'finalizada'].includes(payload.status)) {
        await updateDoc(doc(db, 'requests', payload.requestId), {
          status: 'finalizada',
          finalizadaEm: serverTimestamp(),
          atualizadaEm: serverTimestamp(),
        })
      }
      resetAppointmentForm()
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error)
      setMessage(error.message || 'Nao foi possivel salvar o atendimento.')
    } finally {
      setSavingAppointment(false)
    }
  }

  const editAppointment = (appointment) => {
    setAppointmentForm({
      id: appointment.id,
      requestId: appointment.requestId || '',
      pacienteUid: appointment.pacienteUid || '',
      pacienteNome: appointment.pacienteNome || '',
      data: toDateTimeLocal(appointment.data),
      modalidade: appointment.modalidade || profile?.atendimento || 'Online',
      status: appointment.status || 'agendada',
      observacoes: appointment.observacoes || '',
    })
  }

  const removeAppointment = async (appointment) => {
    if (!window.confirm('Excluir este evento da agenda?')) return
    setSavingAppointment(true)
    setMessage('')
    try {
      await deleteDoc(doc(db, 'appointments', appointment.id))
      setMessage('Atendimento excluido com sucesso.')
      if (appointmentForm.id === appointment.id) resetAppointmentForm()
    } catch (error) {
      console.error('Erro ao excluir atendimento:', error)
      setMessage(error.message || 'Nao foi possivel excluir o atendimento.')
    } finally {
      setSavingAppointment(false)
    }
  }

  return (
    <div>
      <SectionHeader title="Agenda" description="Selecione um dia e horario na grade para criar ou editar eventos salvos em appointments." />
      {message && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.includes('sucesso') ? 'border-sage-100 bg-sage-50 text-sage-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Disponibilidade semanal</h2>
            <select className="input-field" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="">Selecione</option>
              {AVAILABILITY_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button onClick={saveAvailability} disabled={savingAvailability} className="btn-primary mt-3 w-full gap-2"><Icon name="save" />{savingAvailability ? 'Salvando...' : 'Salvar horarios'}</button>
          </div>

          <form onSubmit={saveAppointment} className="card p-5">
            <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">{appointmentForm.id ? 'Editar evento' : 'Novo evento'}</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Atendimento aceito</label>
                <select className="input-field" value={appointmentForm.requestId} onChange={(e) => selectRequest(e.target.value)}>
                  <option value="">Evento avulso</option>
                  {acceptedRequests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.pacienteNome || 'Paciente anonimo'} - {request.categoria || 'Solicitacao'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-stone-400">Escolha uma solicitacao aceita para vincular agenda, chat e avaliacao.</p>
              </div>
              <div>
                <label className="label">Paciente</label>
                <input className="input-field" value={appointmentForm.pacienteNome} onChange={(e) => setAppointmentForm((current) => ({ ...current, pacienteNome: e.target.value }))} placeholder="Paciente anonimo" />
              </div>
              <div>
                <label className="label">Data e hora</label>
                <input type="datetime-local" className="input-field" value={appointmentForm.data} onChange={(e) => setAppointmentForm((current) => ({ ...current, data: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Modalidade</label>
                <select className="input-field" value={appointmentForm.modalidade} onChange={(e) => setAppointmentForm((current) => ({ ...current, modalidade: e.target.value }))}>
                  {SERVICE_MODALITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={appointmentForm.status} onChange={(e) => setAppointmentForm((current) => ({ ...current, status: e.target.value }))}>
                  <option value="agendada">Agendada</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="concluida">Concluida</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="label">Observacoes</label>
                <textarea className="input-field" rows={3} value={appointmentForm.observacoes} onChange={(e) => setAppointmentForm((current) => ({ ...current, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {appointmentForm.id && <button type="button" onClick={resetAppointmentForm} className="btn-secondary flex-1">Cancelar</button>}
              <button type="submit" disabled={savingAppointment} className="btn-primary flex-1 gap-2"><Icon name="calendar" />{savingAppointment ? 'Salvando...' : appointmentForm.id ? 'Atualizar' : 'Criar'}</button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="card schedule-board overflow-hidden p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sans text-base font-semibold text-stone-950">Semana</h2>
                <p className="text-sm text-stone-500">Clique em um horario livre para preparar um novo atendimento.</p>
              </div>
              <span className="badge schedule-count border border-stone-200 bg-stone-50 text-stone-600">{upcoming.length} eventos ativos</span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="schedule-header grid grid-cols-[72px_repeat(7,minmax(104px,1fr))] border-b border-stone-200 text-xs font-medium text-stone-500">
                  <div className="px-2 py-2">Hora</div>
                  {scheduleDays.map((day) => (
                    <div key={day.toISOString()} className="px-2 py-2 text-center">
                      <p className="font-semibold text-stone-800">{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day)}</p>
                      <p>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(day)}</p>
                    </div>
                  ))}
                </div>

                {scheduleHours.map((hour) => (
                  <div key={hour} className="schedule-row grid grid-cols-[72px_repeat(7,minmax(104px,1fr))] border-b border-stone-100 last:border-b-0">
                    <div className="schedule-hour flex items-center px-2 py-2 text-xs font-semibold text-stone-500">{hour}</div>
                    {scheduleDays.map((day) => {
                      const key = slotKey(day, hour)
                      const appointment = appointmentBySlot.get(key)
                      const selected = appointmentForm.data === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => selectSlot(day, hour)}
                          className={`schedule-slot m-1 min-h-16 rounded-lg border px-2 py-2 text-left text-xs transition-colors duration-150 ${
                            appointment
                              ? 'schedule-slot-booked border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-400'
                              : selected
                                ? 'schedule-slot-selected border-cyan-300 bg-cyan-50 text-cyan-800'
                                : 'schedule-slot-free border-stone-200 bg-stone-50/70 text-stone-500 hover:border-brand-200 hover:bg-brand-50'
                          }`}
                        >
                          {appointment ? (
                            <>
                              <span className="block truncate font-semibold">{appointment.pacienteNome || 'Paciente anonimo'}</span>
                              <span className="mt-1 block truncate">{appointment.status || 'agendada'}{appointment.requestId ? ' - atendimento' : ''}</span>
                            </>
                          ) : (
                            <span className="schedule-free-label flex h-full items-center justify-center text-stone-400">Livre</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card schedule-events p-5">
            <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Eventos ativos</h2>
            {upcoming.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {upcoming.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-stone-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-stone-800">{appointment.pacienteNome || 'Paciente anonimo'}</p>
                      <span className="badge border border-stone-200 bg-stone-50 text-stone-600">{appointment.status || 'agendada'}</span>
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{formatDate(appointment.data)}</p>
                    <p className="text-xs text-stone-400">{appointment.modalidade || profile?.atendimento || 'Modalidade nao informada'}</p>
                    {appointment.requestId && <p className="mt-1 text-xs font-medium text-brand-700">Vinculado a solicitacao aceita</p>}
                    {appointment.observacoes && <p className="mt-2 text-xs text-stone-500">{appointment.observacoes}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => editAppointment(appointment)} className="btn-secondary px-3 py-2 text-xs">Editar</button>
                      <button onClick={() => removeAppointment(appointment)} disabled={savingAppointment} className="btn-secondary px-3 py-2 text-xs text-red-600">Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="calendar" title="Agenda vazia" description="Selecione um horario livre na grade para criar o primeiro evento." />
            )}
          </div>
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
  const accessData = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((label, day) => ({
    label,
    value: data.profileViews.filter((view) => toDate(view.criadaEm)?.getDay() === day).length,
  }))

  return (
    <div>
      <SectionHeader title="Estatisticas" description="Graficos exibem apenas dados reais; quando nao ha base suficiente, mostram estado vazio." />
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Solicitacoes recebidas" value={data.requests.length} icon="inbox" />
        <StatCard label="Avaliacoes recebidas" value={data.reviews.length} icon="star" />
        <StatCard label="Novos pacientes" value={metrics.helpedPatients} icon="users" />
        <StatCard label="Acessos ao perfil" value={metrics.profileViews} icon="eye" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Solicitacoes por status</h2>
          <SmallBarChart data={requestData} emptyText="Nenhuma solicitacao real foi registrada." />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-sans text-base font-semibold text-stone-950">Acessos por dia da semana</h2>
          <SmallBarChart data={accessData} emptyText="Acessos ao perfil ainda nao foram registrados." />
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

function SettingsPage({ user, profile, onNavigate }) {
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [preferences, setPreferences] = useState({
    notificacoesEmail: true,
    perfilPublico: true,
    mostrarValorConsulta: true,
    aceitarSolicitacoes: true,
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [loadingAction, setLoadingAction] = useState('')

  useEffect(() => {
    setEmail(user?.email || '')
  }, [user?.email])

  useEffect(() => {
    setPreferences({
      notificacoesEmail: profile?.preferencias?.notificacoesEmail ?? true,
      perfilPublico: profile?.preferencias?.perfilPublico ?? true,
      mostrarValorConsulta: profile?.preferencias?.mostrarValorConsulta ?? true,
      aceitarSolicitacoes: profile?.preferencias?.aceitarSolicitacoes ?? true,
    })
  }, [profile])

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  const firebaseErrorMessage = (error, fallback) => {
    const messages = {
      'auth/requires-recent-login': 'Por seguranca, faca login novamente antes de alterar este dado.',
      'auth/invalid-email': 'Informe um e-mail valido.',
      'auth/email-already-in-use': 'Este e-mail ja esta em uso.',
      'auth/weak-password': 'A nova senha esta fraca. Use pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
    }
    return messages[error.code] || error.message || fallback
  }

  const changeEmail = async () => {
    const nextEmail = email.trim()
    if (!nextEmail) {
      showMessage('Informe um e-mail valido.', 'error')
      return
    }
    if (nextEmail === user?.email) {
      showMessage('Este e-mail ja esta salvo na sua conta.', 'success')
      return
    }

    setLoadingAction('email')
    setMessage('')
    try {
      await updateEmail(user, nextEmail)
      await updateDoc(doc(db, 'users', user.uid), {
        email: nextEmail,
        atualizadoEm: serverTimestamp(),
      })
      showMessage('E-mail atualizado com sucesso.')
    } catch (error) {
      console.error('Erro ao alterar e-mail:', error)
      showMessage(firebaseErrorMessage(error, 'Nao foi possivel alterar o e-mail.'), 'error')
    } finally {
      setLoadingAction('')
    }
  }

  const changePassword = async () => {
    if (password.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres.', 'error')
      return
    }
    if (password !== passwordConfirm) {
      showMessage('As senhas nao coincidem.', 'error')
      return
    }

    setLoadingAction('password')
    setMessage('')
    try {
      await updatePassword(user, password)
      setPassword('')
      setPasswordConfirm('')
      showMessage('Senha atualizada com sucesso.')
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      showMessage(firebaseErrorMessage(error, 'Nao foi possivel alterar a senha.'), 'error')
    } finally {
      setLoadingAction('')
    }
  }

  const savePreferences = async () => {
    if (!user?.uid) {
      showMessage('Nao foi possivel identificar sua sessao. Faca login novamente.', 'error')
      return
    }

    setLoadingAction('preferences')
    setMessage('')
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        preferencias: preferences,
        atualizadoEm: serverTimestamp(),
      })
      showMessage('Preferencias salvas. O diretorio e o preview passam a respeitar sua privacidade.')
    } catch (error) {
      console.error('Erro ao salvar preferencias:', error)
      showMessage(error.message || 'Nao foi possivel salvar as preferencias.', 'error')
    } finally {
      setLoadingAction('')
    }
  }

  const deleteAccount = async () => {
    if (!window.confirm('Excluir sua conta permanentemente?')) return
    setLoadingAction('delete')
    setMessage('')
    try {
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(user)
    } catch (error) {
      console.error('Erro ao excluir conta:', error)
      showMessage(firebaseErrorMessage(error, 'Nao foi possivel excluir a conta.'), 'error')
    } finally {
      setLoadingAction('')
    }
  }

  return (
    <div>
      <SectionHeader title="Configuracoes" description="Preferencias, seguranca e acoes de conta com execucao real no Firebase." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="mail" className="h-4 w-4 text-brand-600" />
            <h2 className="font-sans text-base font-semibold text-stone-950">Dados da conta</h2>
          </div>
          <label className="label">E-mail</label>
          <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <p className="mt-2 text-xs text-stone-400">Alteracoes sensiveis podem exigir login recente.</p>
          <button onClick={changeEmail} disabled={loadingAction === 'email'} className="btn-primary mt-3 gap-2"><Icon name="save" />{loadingAction === 'email' ? 'Salvando...' : 'Alterar e-mail'}</button>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="lock" className="h-4 w-4 text-brand-600" />
            <h2 className="font-sans text-base font-semibold text-stone-950">Seguranca</h2>
          </div>
          <label className="label">Nova senha</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <label className="label mt-3">Confirmar nova senha</label>
          <input type="password" className="input-field" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} autoComplete="new-password" />
          <button onClick={changePassword} disabled={!password || !passwordConfirm || loadingAction === 'password'} className="btn-primary mt-3 gap-2"><Icon name="lock" />{loadingAction === 'password' ? 'Salvando...' : 'Alterar senha'}</button>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="settings" className="h-4 w-4 text-brand-600" />
            <h2 className="font-sans text-base font-semibold text-stone-950">Preferencias e privacidade</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['notificacoesEmail', 'Receber notificacoes por e-mail', 'Avisos de solicitacoes e atividades importantes.'],
              ['perfilPublico', 'Perfil visivel no diretorio', 'Permite que usuarios encontrem seu perfil profissional.'],
              ['mostrarValorConsulta', 'Mostrar valor da consulta', 'Exibe o valor cadastrado no perfil publico.'],
              ['aceitarSolicitacoes', 'Aceitar novas solicitacoes', 'Usuarios podem enviar pedidos de contato.'],
            ].map(([key, title, description]) => (
              <label key={key} className="settings-option flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/70 p-3">
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(e) => setPreferences((current) => ({ ...current, [key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-stone-900">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-stone-500">{description}</span>
                </span>
              </label>
            ))}
          </div>
          <button onClick={savePreferences} disabled={loadingAction === 'preferences'} className="btn-primary mt-4 gap-2"><Icon name="save" />{loadingAction === 'preferences' ? 'Salvando...' : 'Salvar preferencias'}</button>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="logout" className="h-4 w-4 text-brand-600" />
            <h2 className="font-sans text-base font-semibold text-stone-950">Sessao</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-stone-500">Encerre sua sessao neste dispositivo.</p>
          <button onClick={() => onNavigate('logout')} className="btn-secondary gap-2"><Icon name="logout" />Logout</button>
        </div>

        <div className="card border-red-100 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="trash" className="h-4 w-4 text-red-500" />
            <h2 className="font-sans text-base font-semibold text-stone-950">Zona de risco</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-stone-500">Excluir a conta remove seu documento de usuario e tenta remover tambem a conta de autenticacao.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={deleteAccount} disabled={loadingAction === 'delete'} className="btn-secondary gap-2 text-red-600"><Icon name="trash" />{loadingAction === 'delete' ? 'Excluindo...' : 'Excluir conta'}</button>
          </div>
        </div>
      </div>
      {message && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${messageType === 'error' ? 'border-red-100 bg-red-50 text-red-600' : 'border-sage-100 bg-sage-50 text-sage-700'}`}>
          {message}
        </div>
      )}
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
        return <RequestsPage requests={data.requests} user={user} profile={profile} />
      case 'sessions':
        return <SessionsPage requests={data.requests} user={user} />
      case 'community':
        return <CommunityPage posts={data.posts} savedIds={data.savedIds} user={user} />
      case 'answer':
        return <AnswerPage posts={data.posts} user={user} />
      case 'reviews':
        return <ReviewsPage reviews={data.reviews} />
      case 'schedule':
        return <SchedulePage appointments={data.appointments} requests={data.requests} profile={profile} user={user} />
      case 'stats':
        return <StatsPage data={data} metrics={metrics} user={user} />
      case 'settings':
        return <SettingsPage user={user} profile={profile} onNavigate={onNavigate} />
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
