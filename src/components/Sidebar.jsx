// src/components/Sidebar.jsx

const navItems = [
  { id: 'home',          icon: '🏠', label: 'Feed'          },
  { id: 'create',        icon: '✍️', label: 'Novo desabafo' },
  { id: 'professionals', icon: '🩺', label: 'Profissionais'  },
  { id: 'myposts',       icon: '📝', label: 'Meus desabafos' },
]

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-14 left-0 bottom-0 z-40 w-56 bg-white border-r border-stone-100
        flex flex-col pt-4 pb-6 px-3
        transition-transform duration-300
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose() }}
              className={`sidebar-link w-full ${activePage === item.id ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Aviso bottom */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Lembrete:</strong> Em crise? Ligue para o <strong>CVV: 188</strong> (24h).
          </p>
        </div>
      </aside>
    </>
  )
}
