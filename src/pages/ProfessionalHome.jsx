<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'

const stats = [
  { label: 'Total de atendimentos', value: '126', icon: 'users', tone: 'bg-brand-50 text-brand-700 border-brand-100', delta: '+12 este mes' },
  { label: 'Perfil visualizado', value: '1.284', icon: 'eye', tone: 'bg-sage-50 text-sage-700 border-sage-100', delta: '+42%' },
  { label: 'Mensagens respondidas', value: '312', icon: 'message', tone: 'bg-indigo-50 text-indigo-700 border-indigo-100', delta: '18 na semana' },
  { label: 'Solicitacoes pendentes', value: '4', icon: 'inbox', tone: 'bg-amber-50 text-amber-700 border-amber-100', delta: '2 urgentes' },
  { label: 'Avaliacao media', value: '4.9', icon: 'star', tone: 'bg-yellow-50 text-yellow-700 border-yellow-100', delta: '38 avaliacoes' },
  { label: 'Taxa de resposta', value: '96%', icon: 'activity', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', delta: '+8%' },
  { label: 'Tempo medio de resposta', value: '18min', icon: 'clock', tone: 'bg-sky-50 text-sky-700 border-sky-100', delta: 'meta: 30min' },
  { label: 'Pacientes ajudados', value: '89', icon: 'heart', tone: 'bg-rose-50 text-rose-700 border-rose-100', delta: '+7 recentes' },
]

const tasks = [
  { label: 'Complete sua biografia', progress: 80 },
  { label: 'Adicionar foto profissional', progress: 100 },
  { label: 'Inserir especialidades', progress: 70 },
  { label: 'Verificar e-mail', progress: 100 },
  { label: 'Adicionar CRP', progress: 60 },
  { label: 'Definir disponibilidade', progress: 45 },
]

const requests = [
  { name: 'Maria', text: 'deseja conversar sobre ansiedade no trabalho.', time: 'Agora', action: 'Responder' },
  { name: 'Carlos', text: 'comentou no seu perfil publico.', time: '12 min', action: 'Ver comentario' },
  { name: 'Ana', text: 'respondeu sua mensagem na comunidade.', time: '34 min', action: 'Abrir conversa' },
  { name: 'Pedro', text: 'enviou um agradecimento pelo acolhimento.', time: '1 h', action: 'Visualizar' },
]

const community = [
  { label: 'Novos desabafos', value: '23', icon: 'message' },
  { label: 'Perguntas sem resposta', value: '8', icon: 'alert' },
  { label: 'Postagens populares', value: '5', icon: 'trend' },
]

const schedule = [
  { hour: '09:00', title: 'Triagem inicial', mode: 'Online' },
  { hour: '11:30', title: 'Retorno breve', mode: 'Online' },
  { hour: '15:00', title: 'Janela disponivel', mode: 'Livre' },
]

const goals = [
  'Complete seu perfil',
  'Responda 5 pessoas',
  'Atualize sua disponibilidade',
  'Receba sua primeira avaliacao',
  'Alcance perfil verificado',
]

const quickActions = [
  { label: 'Nova publicacao', icon: 'plus' },
  { label: 'Responder comunidade', icon: 'pen' },
  { label: 'Editar perfil', icon: 'user' },
  { label: 'Atualizar disponibilidade', icon: 'calendar' },
  { label: 'Ver solicitacoes', icon: 'inbox' },
]

function Card({ children, className = '', id }) {
  return (
    <section id={id} className={`card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${className}`}>
      {children}
    </section>
  )
}

function SectionTitle({ icon, title, description, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="h-4 w-4 text-brand-600" />}
          <h2 className="font-sans text-base font-semibold text-stone-900">{title}</h2>
        </div>
        {description && <p className="mt-1 text-sm leading-relaxed text-stone-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function SkeletonLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-5 h-8 w-8 rounded-lg bg-stone-100" />
          <div className="mb-3 h-4 w-20 rounded bg-stone-100" />
          <div className="h-3 w-28 rounded bg-stone-100" />
        </div>
      ))}
    </div>
  )
}

function StatCard({ item }) {
  return (
    <div className="group rounded-lg border border-stone-200 bg-white p-4 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-brand-100 hover:shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className={`rounded-lg border p-2 ${item.tone}`}>
          <Icon name={item.icon} className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium text-stone-400 transition group-hover:text-brand-600">{item.delta}</span>
      </div>
      <p className="text-2xl font-semibold tracking-normal text-stone-950">{item.value}</p>
      <p className="mt-1 text-sm text-stone-500">{item.label}</p>
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  )
}

function PublicProfilePreview({ displayName, profile, areas }) {
  return (
    <Card id="profile" className="lg:col-span-7">
      <SectionTitle
        icon="eye"
        title="Preview do perfil publico"
        description="Como pacientes enxergam suas informacoes antes de solicitar contato."
        action={<button className="btn-secondary gap-2 whitespace-nowrap"><Icon name="edit" />Editar Perfil</button>}
      />

      <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-20 w-20 rounded-lg bg-stone-900 text-white shadow-soft flex items-center justify-center text-xl font-semibold">
            {displayName.split(' ').map((item) => item[0]).slice(0, 2).join('').toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-stone-950">{displayName}</h3>
                <p className="text-sm font-medium text-brand-700">{profile?.especialidade || 'Psicologia clinica'}</p>
                <p className="mt-1 text-xs text-stone-500">{profile?.crp || 'CRP 06/123456'} · {profile?.cidade || 'Sao Paulo, SP'}</p>
              </div>
              <span className="badge border border-sage-100 bg-sage-50 text-sage-700">
                <Icon name="check" className="h-3 w-3" />
                Verificado
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400">Modalidade</p>
                <p className="text-sm font-medium text-stone-800">{profile?.atendimento || 'Online e presencial'}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400">Preco</p>
                <p className="text-sm font-medium text-stone-800">{profile?.preco || 'R$ 180 / sessao'}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400">Disponibilidade</p>
                <p className="text-sm font-medium text-stone-800">Hoje, 15:00</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              {profile?.descricao || 'Atendimento acolhedor para adultos que buscam lidar com ansiedade, autoestima, relacionamentos e momentos de transicao, com escuta etica e plano de cuidado claro.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map((area) => (
                <span key={area} className="badge border border-stone-200 bg-white text-stone-600">{area}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function ProfessionalHome({ user, profile, onNavigate }) {
  const [loading, setLoading] = useState(true)
  const displayName = profile?.nome || user?.displayName || 'Dr(a). Joao'
  const areas = useMemo(
    () => profile?.areas?.length ? profile.areas : ['Ansiedade', 'Autoestima', 'Relacionamentos', 'Terapia cognitivo-comportamental'],
    [profile?.areas]
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-7">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              <Icon name="shield" className="h-3.5 w-3.5" />
              Central profissional SafeTalk
            </span>
            <h1 className="mt-5 max-w-3xl font-sans text-3xl font-semibold tracking-normal text-stone-950 md:text-4xl">
              Ola, {displayName}.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600">
              Hoje voce possui <strong className="text-stone-950">4 novas solicitacoes</strong> e respondeu <strong className="text-stone-950">18 pessoas</strong> nesta semana.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => onNavigate('profile')} className="btn-primary gap-2"><Icon name="edit" />Editar Perfil</button>
              <button onClick={() => onNavigate('requests')} className="btn-secondary gap-2"><Icon name="inbox" />Ver Solicitacoes</button>
              <button onClick={() => onNavigate('community')} className="btn-secondary gap-2"><Icon name="message" />Responder Comunidade</button>
              <button onClick={() => onNavigate('schedule')} className="btn-secondary gap-2"><Icon name="calendar" />Minha Agenda</button>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-900">Perfil 82% completo</p>
              <span className="badge border border-sage-100 bg-sage-50 text-sage-700">Ativo</span>
            </div>
            <ProgressBar value={82} />
            <p className="mt-4 text-sm leading-relaxed text-stone-500">
              Faltam disponibilidade detalhada, biografia revisada e comprovacao final do registro.
            </p>
            <button className="btn-secondary mt-4 w-full gap-2">
              <Icon name="zap" />
              Completar Perfil
            </button>
=======
import Icon from '../components/Icon'

const profileTips = [
  'Mantenha areas de atuacao e abordagem claras.',
  'Use uma descricao breve, humana e objetiva.',
  'Inclua disponibilidade para reduzir mensagens desencontradas.',
]

export default function ProfessionalHome({ user, profile, onNavigate }) {
  const displayName = profile?.nome || user?.displayName || 'profissional'
  const areas = profile?.areas?.length ? profile.areas : [profile?.especialidade].filter(Boolean)

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-stone-900 text-white p-6 md:p-7 overflow-hidden relative">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-100 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
            <Icon name="shield" className="w-3.5 h-3.5" />
            Painel profissional
          </span>
          <h1 className="font-serif text-3xl mt-4 mb-2">Ola, {displayName}</h1>
          <p className="text-stone-300 text-sm leading-relaxed max-w-xl">
            Esta area e pensada para quem oferece suporte. Aqui voce acompanha seu perfil, entende como aparece no diretorio e pode participar da comunidade com cuidado.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-14 w-48 h-48 rounded-full border border-white/10" />
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="card p-4">
          <Icon name="users" className="w-5 h-5 text-brand-600 mb-3" />
          <p className="font-serif text-2xl text-stone-900">{areas.length || 0}</p>
          <p className="text-xs text-stone-500">areas no perfil</p>
        </div>
        <div className="card p-4">
          <Icon name="mail" className="w-5 h-5 text-sage-600 mb-3" />
          <p className="font-serif text-2xl text-stone-900">{profile?.atendimento || 'Online'}</p>
          <p className="text-xs text-stone-500">tipo de atendimento</p>
        </div>
        <div className="card p-4">
          <Icon name="star" className="w-5 h-5 text-amber-500 mb-3" />
          <p className="font-serif text-2xl text-stone-900">{profile?.media ? profile.media.toFixed(1) : 'Novo'}</p>
          <p className="text-xs text-stone-500">avaliacao</p>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-serif text-xl text-stone-900 mb-1">Como seu perfil aparece</h2>
            <p className="text-sm text-stone-500">Essas informacoes ajudam pacientes a entender seu trabalho antes do primeiro contato.</p>
          </div>
          <span className="badge bg-sage-50 text-sage-700 border border-sage-100">
            <Icon name="check" className="w-3 h-3" />
            Verificado
          </span>
        </div>

        <div className="rounded-lg border border-stone-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif">
              {displayName.split(' ').map((item) => item[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-stone-900">{displayName}</h3>
              <p className="text-sm text-brand-700 font-medium">{profile?.especialidade || areas[0] || 'Profissional de apoio'}</p>
              {profile?.crp && <p className="text-xs text-stone-400 mt-1">{profile.crp}</p>}
              {areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {areas.slice(0, 4).map((area) => (
                    <span key={area} className="badge bg-stone-50 text-stone-600 border border-stone-200">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
>>>>>>> 27459c9d8e4e689f25ee4b5060eae98e0a4115e8
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {loading ? (
        <SkeletonLoading />
      ) : (
        <section id="stats" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => <StatCard key={item.label} item={item} />)}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-12">
        <PublicProfilePreview displayName={displayName} profile={profile} areas={areas} />

        <Card className="lg:col-span-5">
          <SectionTitle icon="check" title="Proximas pendencias" description="Tarefas para deixar seu perfil mais confiavel." />
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-700">{task.label}</p>
                  <span className="text-xs text-stone-400">{task.progress}%</span>
                </div>
                <ProgressBar value={task.progress} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card id="requests" className="lg:col-span-2">
          <SectionTitle icon="inbox" title="Solicitacoes recentes" description="Pedidos e interacoes que precisam de resposta rapida." />
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.name} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4 transition hover:border-brand-100 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-stone-700"><strong className="text-stone-950">{request.name}</strong> {request.text}</p>
                  <p className="mt-1 text-xs text-stone-400">{request.time}</p>
                </div>
                <button className="btn-secondary px-3 py-2 text-xs">{request.action}</button>
              </div>
            ))}
          </div>
        </Card>

        <Card id="answer">
          <SectionTitle icon="message" title="Comunidade" description="Resumo do que esta acontecendo no feed." />
          <div className="space-y-3">
            {community.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-stone-200 p-3">
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className="h-4 w-4 text-brand-600" />
                  <p className="text-sm text-stone-600">{item.label}</p>
                </div>
                <p className="text-sm font-semibold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('community')} className="btn-primary mt-4 w-full gap-2">
            Ir para comunidade
            <Icon name="chevronRight" />
          </button>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Card id="schedule" className="lg:col-span-4">
          <SectionTitle icon="calendar" title="Agenda" description="Proximos horarios e disponibilidade." />
          <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
              <span key={`${day}-${index}`} className="py-1">{day}</span>
            ))}
            {Array.from({ length: 28 }, (_, index) => (
              <button key={index} className={`aspect-square rounded-lg text-xs transition ${[2, 8, 15, 23].includes(index) ? 'bg-brand-600 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}>
                {index + 1}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {schedule.map((item) => (
              <div key={item.hour} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                <span className="text-sm font-semibold text-stone-950">{item.hour}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-stone-700">{item.title}</p>
                  <p className="text-xs text-stone-400">{item.mode}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card id="reviews" className="lg:col-span-4">
          <SectionTitle icon="star" title="Avaliacoes" description="Reputacao e comentarios recentes." />
          <div className="mb-5 flex items-end gap-3">
            <p className="text-5xl font-semibold text-stone-950">4.9</p>
            <div className="pb-1">
              <p className="text-sm text-amber-500">★★★★★</p>
              <p className="text-xs text-stone-400">38 avaliacoes publicas</p>
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm leading-relaxed text-stone-600">
              "Escuta muito cuidadosa e orientacoes claras para os proximos passos."
            </p>
          </div>
          <button className="btn-secondary mt-4 w-full gap-2">Ver avaliacoes <Icon name="chevronRight" /></button>
        </Card>

        <Card className="lg:col-span-4">
          <SectionTitle icon="trend" title="Insights" description="Desempenho do seu trabalho na plataforma." />
          <div className="space-y-3 text-sm text-stone-600">
            <p>Voce respondeu <strong className="text-stone-950">28 pessoas</strong> este mes.</p>
            <p>Seu perfil recebeu <strong className="text-stone-950">+42% visitas</strong>.</p>
            <p>Tempo medio de resposta: <strong className="text-stone-950">18 minutos</strong>.</p>
            <p className="rounded-lg border border-sage-100 bg-sage-50 p-3 text-sage-800">Voce esta entre os profissionais mais ativos.</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon="award" title="Objetivos" description="Metas pequenas para aumentar confianca e produtividade." />
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <div key={goal} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${index < 3 ? 'bg-sage-50 text-sage-700' : 'bg-stone-50 text-stone-400'}`}>
                  <Icon name={index < 3 ? 'check' : 'clock'} className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium text-stone-700">{goal}</p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-700">Progresso geral</span>
              <span className="text-stone-400">62%</span>
            </div>
            <ProgressBar value={62} />
          </div>
        </Card>

        <Card id="settings">
          <SectionTitle icon="zap" title="Acoes rapidas" description="Atalhos para as tarefas mais frequentes." />
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button key={action.label} className="group flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4 text-left transition hover:border-brand-100 hover:bg-brand-50/40">
                <span className="flex items-center gap-3 text-sm font-medium text-stone-700">
                  <Icon name={action.icon} className="h-4 w-4 text-brand-600" />
                  {action.label}
                </span>
                <Icon name="chevronRight" className="h-4 w-4 text-stone-300 transition group-hover:text-brand-600" />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
            <div className="flex items-start gap-3">
              <Icon name="bell" className="mt-0.5 h-4 w-4 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-stone-900">Feedback visual</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  Estados de carregamento, hover, progresso e confirmacoes foram adicionados para deixar o painel mais responsivo e confiavel.
                </p>
              </div>
            </div>
          </div>
        </Card>
=======
      <section className="grid md:grid-cols-[1fr_0.9fr] gap-4">
        <div className="card p-5">
          <h2 className="font-serif text-xl text-stone-900 mb-4">Proximos cuidados</h2>
          <div className="space-y-3">
            {profileTips.map((tip) => (
              <p key={tip} className="flex items-start gap-2 text-sm text-stone-600">
                <Icon name="check" className="w-4 h-4 text-sage-600 mt-0.5 flex-shrink-0" />
                {tip}
              </p>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-xl text-stone-900 mb-2">Comunidade</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-4">
            Voce tambem pode ler o feed e responder quando fizer sentido, mantendo uma postura acolhedora e sem diagnosticar.
          </p>
          <button onClick={() => onNavigate('community')} className="btn-secondary w-full gap-2">
            <Icon name="message" className="w-4 h-4" />
            Ver feed da comunidade
          </button>
        </div>
>>>>>>> 27459c9d8e4e689f25ee4b5060eae98e0a4115e8
      </section>
    </div>
  )
}
