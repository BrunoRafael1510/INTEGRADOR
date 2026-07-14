import { useState } from 'react'
import Icon from './Icon'

const patientNavItems = [
  { id: 'home', icon: 'home', label: 'Feed' },
  { id: 'create', icon: 'edit', label: 'Novo desabafo' },
  { id: 'professionals', icon: 'users', label: 'Profissionais' },
  { id: 'patientSessions', icon: 'heart', label: 'Atendimentos' },
  { id: 'patientReviews', icon: 'star', label: 'Avaliar profissionais' },
  { id: 'myposts', icon: 'file', label: 'Meus desabafos' },
]

const professionalNavItems = [
  { id: 'home', icon: 'home', label: 'Visao Geral' },
  { id: 'profile', icon: 'user', label: 'Meu Perfil' },
  { id: 'requests', icon: 'inbox', label: 'Solicitacoes' },
  { id: 'sessions', icon: 'heart', label: 'Atendimentos' },
  { id: 'community', icon: 'message', label: 'Comunidade' },
  { id: 'answer', icon: 'pen', label: 'Responder Desabafos' },
  { id: 'reviews', icon: 'star', label: 'Avaliacoes' },
  { id: 'schedule', icon: 'calendar', label: 'Agenda' },
  { id: 'stats', icon: 'chart', label: 'Estatisticas' },
  { id: 'settings', icon: 'settings', label: 'Configuracoes' },
  { id: 'logout', icon: 'logout', label: 'Sair' },
]

function profileCompletion(profile) {
  const fields = ['nome', 'crp', 'especialidade', 'areas', 'formacao', 'experiencia', 'descricao', 'atendimento', 'cidade', 'estado', 'valorConsulta', 'idiomas', 'disponibilidade']
  const filled = fields.filter((field) => {
    const value = profile?.[field]
    return Array.isArray(value) ? value.length > 0 : Boolean(value)
  }).length
  return Math.round((filled / fields.length) * 100)
}

function initials(name) {
  return String(name || '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose, profile, navCounts = {} }) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isProfessional = profile?.tipo === 'profissional'
  const items = isProfessional ? professionalNavItems.filter((item) => item.id !== 'profile') : patientNavItems
  const expanded = pinned || hovered || isOpen

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`rail-nav fixed left-0 top-14 bottom-0 z-40 border-r border-stone-200 bg-stone-50/95 px-2 py-3 shadow-soft backdrop-blur-md transition-[width,transform] duration-200 ${
          expanded ? 'w-64 translate-x-0' : 'w-[68px] translate-x-0'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPinned((current) => !current)}
            className={`rail-pin flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 transition-colors ${pinned ? 'bg-brand-600 text-stone-50' : 'bg-stone-50 text-stone-500 hover:border-brand-200 hover:text-brand-700'}`}
            title={pinned ? 'Desafixar menu' : 'Fixar menu aberto'}
          >
            <Icon name={pinned ? 'x' : 'menu'} className="h-4 w-4" />
          </button>
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-stone-900">SafeTalk</p>
              <p className="truncate text-[11px] text-stone-400">{isProfessional ? 'Area profissional' : 'Area do usuario'}</p>
            </div>
          )}
        </div>

        <nav className="flex h-[calc(100%-52px)] flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1">
        {isProfessional && profile && (
          <button
            type="button"
            onClick={() => { onNavigate('profile'); onClose() }}
            className={`rail-profile-chip mb-2 rounded-lg border border-stone-200 bg-stone-100/60 p-2 text-left ${activePage === 'profile' ? 'ring-1 ring-brand-200' : ''}`}
            title="Meu perfil"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-stone-50">
                {initials(profile?.nome)}
              </div>
              {expanded && <div className="min-w-0">
                <p className="max-w-28 truncate text-xs font-semibold text-brand-800">{profileCompletion(profile)}%</p>
                <p className="max-w-28 truncate text-[11px] text-stone-500">{profile?.especialidade || 'Meu perfil'}</p>
              </div>}
            </div>
          </button>
        )}
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`sidebar-link rail-link relative w-full ${expanded ? '' : 'justify-center'} ${activePage === item.id ? 'active' : ''} ${item.id === 'logout' ? 'mt-2 text-stone-400' : ''}`}
              title={item.label}
            >
              <Icon name={item.icon} className="w-4 h-4" />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
              {navCounts[item.id] > 0 && (
                <span className={`nav-count-badge inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-stone-50 ring-2 ring-stone-50 ${expanded ? 'ml-auto' : 'absolute -right-1 -top-1'}`}>
                  {navCounts[item.id] > 9 ? '9+' : navCounts[item.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
