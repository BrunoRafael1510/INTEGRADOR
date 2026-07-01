import Icon from './Icon'

const patientNavItems = [
  { id: 'home', icon: 'home', label: 'Feed' },
  { id: 'create', icon: 'edit', label: 'Novo desabafo' },
  { id: 'professionals', icon: 'users', label: 'Profissionais' },
  { id: 'myposts', icon: 'file', label: 'Meus desabafos' },
]

const professionalNavItems = [
  { id: 'home', icon: 'home', label: 'Visao Geral' },
  { id: 'profile', icon: 'user', label: 'Meu Perfil' },
  { id: 'requests', icon: 'inbox', label: 'Solicitacoes' },
  { id: 'community', icon: 'message', label: 'Comunidade' },
  { id: 'answer', icon: 'pen', label: 'Responder Desabafos' },
  { id: 'reviews', icon: 'star', label: 'Avaliacoes' },
  { id: 'schedule', icon: 'calendar', label: 'Agenda' },
  { id: 'stats', icon: 'chart', label: 'Estatisticas' },
  { id: 'settings', icon: 'settings', label: 'Configuracoes' },
  { id: 'logout', icon: 'logout', label: 'Sair' },
]

export default function Sidebar({ activePage, onNavigate, isOpen, onClose, profile }) {
  const isProfessional = profile?.tipo === 'profissional'
  const items = isProfessional ? professionalNavItems : patientNavItems

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-14 left-0 bottom-0 z-40 ${isProfessional ? 'w-64' : 'w-56'} bg-white border-r border-stone-200
        flex flex-col pt-4 pb-6 px-3
        transition-transform duration-300
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="flex-1 space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`sidebar-link w-full ${activePage === item.id ? 'active' : ''} ${item.id === 'logout' ? 'mt-3 text-stone-400' : ''}`}
            >
              <Icon name={item.icon} className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {isProfessional ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-semibold text-brand-800">Perfil 82%</p>
              <Icon name="award" className="w-4 h-4 text-brand-600" />
            </div>
            <div className="h-1.5 rounded-full bg-white overflow-hidden">
              <div className="h-full w-[82%] rounded-full bg-brand-600" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-brand-700">
              Complete dados clinicos, disponibilidade e verificacao para receber mais contatos.
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Em crise?</strong> Ligue para o <strong>CVV: 188</strong>, atendimento 24h.
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
