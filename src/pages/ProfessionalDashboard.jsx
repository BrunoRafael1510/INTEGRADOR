import { useState } from 'react'
import Navbar from '../components/Navbar'

const navItems = [
  { id: 'painel', icon: '📊', label: 'Painel' },
  { id: 'consultas', icon: '🩺', label: 'Consultas' },
  { id: 'agenda', icon: '📅', label: 'Agenda' },
  { id: 'pacientes', icon: '👥', label: 'Pacientes' },
  { id: 'chat', icon: '💬', label: 'Chat / Histórico' },
  { id: 'solicitacoes', icon: '📩', label: 'Solicitações' },
  { id: 'financeiro', icon: '💰', label: 'Financeiro' },
  { id: 'relatorios', icon: '📈', label: 'Relatórios' },
  { id: 'perfil', icon: '🩺', label: 'Meu perfil' },
]

const consultasRecentes = [
  {
    paciente: 'Paciente anônimo',
    horario: 'Hoje, 14:00',
    tipo: 'Consulta online',
    status: 'Confirmada',
  },
  {
    paciente: 'Mariana S.',
    horario: 'Hoje, 16:30',
    tipo: 'Acompanhamento',
    status: 'Pendente',
  },
]

const pacientes = [
  {
    nome: 'Paciente anônimo',
    ultimaConsulta: '12/05/2026',
    status: 'Em acompanhamento',
  },
  {
    nome: 'Mariana S.',
    ultimaConsulta: '08/05/2026',
    status: 'Retorno marcado',
  },
  {
    nome: 'Lucas R.',
    ultimaConsulta: '01/05/2026',
    status: 'Aguardando resposta',
  },
]

const mensagens = [
  {
    paciente: 'Paciente anônimo',
    texto: 'Relatou ansiedade antes da próxima consulta.',
    data: 'Hoje, 10:42',
  },
  {
    paciente: 'Mariana S.',
    texto: 'Enviou atualização sobre evolução semanal.',
    data: 'Ontem, 19:15',
  },
]

function SectionHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-2xl text-stone-900 mb-1">{title}</h1>
      <p className="text-stone-500 text-sm">{description}</p>
    </div>
  )
}

function StatusBadge({ children }) {
  return (
    <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
      {children}
    </span>
  )
}

function ProfessionalHome({ user }) {
  return (
    <div>
      <SectionHeader
        title="Painel profissional"
        description="Resumo geral das consultas, agenda, pacientes e atividades recentes."
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-2xl mb-2">📅</p>
          <p className="font-serif text-2xl text-stone-800">2</p>
          <p className="text-xs text-stone-400">Consultas hoje</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">👥</p>
          <p className="font-serif text-2xl text-stone-800">3</p>
          <p className="text-xs text-stone-400">Pacientes ativos</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">📩</p>
          <p className="font-serif text-2xl text-stone-800">4</p>
          <p className="text-xs text-stone-400">Solicitações</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">💬</p>
          <p className="font-serif text-2xl text-stone-800">6</p>
          <p className="text-xs text-stone-400">Mensagens</p>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-serif text-xl text-stone-900 mb-2">
          Olá, {user?.displayName || 'profissional'}
        </h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          Esta é sua área de trabalho. Aqui você acompanha consultas, gerencia horários,
          visualiza pacientes, responde mensagens e acompanha solicitações de atendimento.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-serif text-lg text-stone-900 mb-4">Próximas consultas</h3>

          <div className="space-y-3">
            {consultasRecentes.map((consulta, index) => (
              <div key={index} className="border border-stone-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-medium text-stone-800">{consulta.paciente}</p>
                  <StatusBadge>{consulta.status}</StatusBadge>
                </div>
                <p className="text-sm text-stone-500">{consulta.horario}</p>
                <p className="text-xs text-stone-400">{consulta.tipo}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-serif text-lg text-stone-900 mb-4">Atividades recentes</h3>

          <div className="space-y-3">
            <div className="border border-stone-200 rounded-lg p-4">
              <p className="text-sm text-stone-700">Nova solicitação de atendimento recebida.</p>
              <p className="text-xs text-stone-400">Hoje, 09:20</p>
            </div>

            <div className="border border-stone-200 rounded-lg p-4">
              <p className="text-sm text-stone-700">Paciente enviou mensagem no chat.</p>
              <p className="text-xs text-stone-400">Ontem, 18:45</p>
            </div>

            <div className="border border-stone-200 rounded-lg p-4">
              <p className="text-sm text-stone-700">Consulta marcada para sexta-feira.</p>
              <p className="text-xs text-stone-400">Ontem, 11:10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConsultationsPage() {
  return (
    <div>
      <SectionHeader
        title="Consultas"
        description="Gerencie consultas marcadas, pendentes, finalizadas e canceladas."
      />

      <div className="card p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Consultas de hoje</h2>
            <p className="text-sm text-stone-400">Acompanhe seus atendimentos do dia.</p>
          </div>

          <button className="btn-primary">
            Nova consulta
          </button>
        </div>

        <div className="space-y-3">
          {consultasRecentes.map((consulta, index) => (
            <div key={index} className="border border-stone-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-stone-800">{consulta.paciente}</p>
                <p className="text-sm text-stone-500">{consulta.tipo}</p>
                <p className="text-xs text-stone-400">{consulta.horario}</p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge>{consulta.status}</StatusBadge>
                <button className="text-sm text-brand-700 hover:underline">
                  Acessar consulta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-serif text-xl text-stone-800">12</p>
          <p className="text-xs text-stone-400">Finalizadas no mês</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">⏳</p>
          <p className="font-serif text-xl text-stone-800">3</p>
          <p className="text-xs text-stone-400">Pendentes</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">❌</p>
          <p className="font-serif text-xl text-stone-800">1</p>
          <p className="text-xs text-stone-400">Cancelada</p>
        </div>
      </div>
    </div>
  )
}

function SchedulePage() {
  const horarios = [
    '08:00', '09:00', '10:00', '11:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00',
  ]

  return (
    <div>
      <SectionHeader
        title="Agenda"
        description="Controle seus horários disponíveis e consultas marcadas."
      />

      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Horários disponíveis</h2>
            <p className="text-sm text-stone-400">Configure os horários que os pacientes podem solicitar.</p>
          </div>

          <button className="btn-primary">
            Adicionar horário
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {horarios.map((horario, index) => (
            <button
              key={horario}
              className={`rounded-lg border px-4 py-3 text-sm transition-colors duration-150 ${
                index === 5 || index === 7
                  ? 'bg-brand-50 border-brand-100 text-brand-700'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-brand-100'
              }`}
            >
              {horario}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-serif text-xl text-stone-900 mb-4">Agenda da semana</h2>

        <div className="space-y-3">
          <div className="border border-stone-200 rounded-lg p-4">
            <p className="font-medium text-stone-800">Segunda-feira</p>
            <p className="text-sm text-stone-500">2 consultas marcadas</p>
          </div>

          <div className="border border-stone-200 rounded-lg p-4">
            <p className="font-medium text-stone-800">Terça-feira</p>
            <p className="text-sm text-stone-500">1 consulta marcada</p>
          </div>

          <div className="border border-stone-200 rounded-lg p-4">
            <p className="font-medium text-stone-800">Quarta-feira</p>
            <p className="text-sm text-stone-500">Horários livres</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientsPage() {
  return (
    <div>
      <SectionHeader
        title="Pacientes"
        description="Veja pacientes em acompanhamento e histórico de atendimento."
      />

      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Lista de pacientes</h2>
            <p className="text-sm text-stone-400">Pacientes vinculados ao seu perfil.</p>
          </div>

          <input
            type="text"
            placeholder="Buscar paciente..."
            className="input sm:w-64"
          />
        </div>

        <div className="space-y-3">
          {pacientes.map((paciente, index) => (
            <div key={index} className="border border-stone-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-stone-800">{paciente.nome}</p>
                <p className="text-sm text-stone-500">Última consulta: {paciente.ultimaConsulta}</p>
                <p className="text-xs text-stone-400">{paciente.status}</p>
              </div>

              <button className="text-sm text-brand-700 hover:underline">
                Ver histórico
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChatHistoryPage() {
  return (
    <div>
      <SectionHeader
        title="Chat e histórico"
        description="Acompanhe conversas, anotações e evolução dos pacientes."
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <div className="card p-4">
          <h2 className="font-serif text-lg text-stone-900 mb-4">Conversas</h2>

          <div className="space-y-2">
            {mensagens.map((mensagem, index) => (
              <button
                key={index}
                className="w-full text-left border border-stone-200 rounded-lg p-3 hover:border-brand-100 transition-colors duration-150"
              >
                <p className="font-medium text-sm text-stone-800">{mensagem.paciente}</p>
                <p className="text-xs text-stone-400">{mensagem.data}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-xl text-stone-900 mb-1">Paciente anônimo</h2>
          <p className="text-sm text-stone-400 mb-5">Histórico de mensagens e anotações.</p>

          <div className="space-y-3 mb-5">
            {mensagens.map((mensagem, index) => (
              <div key={index} className="border border-stone-200 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-medium text-stone-800">{mensagem.paciente}</p>
                  <p className="text-xs text-stone-400">{mensagem.data}</p>
                </div>

                <p className="text-sm text-stone-500">{mensagem.texto}</p>
              </div>
            ))}
          </div>

          <textarea
            className="input min-h-28 resize-none"
            placeholder="Escreva uma anotação ou resposta..."
          />

          <div className="flex justify-end mt-3">
            <button className="btn-primary">
              Enviar mensagem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RequestsPage() {
  const solicitacoes = [
    {
      nome: 'Usuário anônimo',
      motivo: 'Ansiedade e dificuldade para dormir',
      data: 'Hoje, 09:20',
    },
    {
      nome: 'Mariana S.',
      motivo: 'Busca acompanhamento semanal',
      data: 'Ontem, 17:30',
    },
  ]

  return (
    <div>
      <SectionHeader
        title="Solicitações"
        description="Pedidos de usuários interessados em iniciar acompanhamento."
      />

      <div className="space-y-4">
        {solicitacoes.map((solicitacao, index) => (
          <div key={index} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="font-medium text-stone-800">{solicitacao.nome}</p>
                <p className="text-sm text-stone-500 mt-1">{solicitacao.motivo}</p>
                <p className="text-xs text-stone-400 mt-2">{solicitacao.data}</p>
              </div>

              <div className="flex gap-2">
                <button className="btn-primary">
                  Aceitar
                </button>

                <button className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-600 hover:bg-stone-100 transition-colors duration-150">
                  Recusar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancePage() {
  return (
    <div>
      <SectionHeader
        title="Financeiro"
        description="Acompanhe pagamentos, consultas pagas e valores pendentes."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <div className="card p-5">
          <p className="text-2xl mb-2">💵</p>
          <p className="font-serif text-2xl text-stone-800">R$ 0,00</p>
          <p className="text-xs text-stone-400">Recebido no mês</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">⏳</p>
          <p className="font-serif text-2xl text-stone-800">R$ 0,00</p>
          <p className="text-xs text-stone-400">Pendente</p>
        </div>

        <div className="card p-5">
          <p className="text-2xl mb-2">🧾</p>
          <p className="font-serif text-2xl text-stone-800">0</p>
          <p className="text-xs text-stone-400">Consultas pagas</p>
        </div>
      </div>

      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">💰</p>
        <p className="font-serif text-lg text-stone-700 mb-1">Financeiro em desenvolvimento</p>
        <p className="text-stone-400 text-sm">
          Aqui futuramente podem aparecer pagamentos, recibos e histórico financeiro.
        </p>
      </div>
    </div>
  )
}

function ReportsPage() {
  return (
    <div>
      <SectionHeader
        title="Relatórios"
        description="Visualize dados de atendimentos, pacientes e evolução do mês."
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="card p-5">
          <h2 className="font-serif text-xl text-stone-900 mb-3">Atendimentos</h2>
          <p className="text-4xl font-serif text-stone-800 mb-1">12</p>
          <p className="text-sm text-stone-400">Consultas realizadas neste mês.</p>
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-xl text-stone-900 mb-3">Novos pacientes</h2>
          <p className="text-4xl font-serif text-stone-800 mb-1">3</p>
          <p className="text-sm text-stone-400">Pacientes iniciaram acompanhamento.</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-serif text-xl text-stone-900 mb-3">Resumo</h2>
        <p className="text-sm text-stone-500 leading-relaxed">
          Esta área pode ser usada para mostrar gráficos de consultas, taxa de retorno,
          solicitações aceitas, cancelamentos e evolução dos acompanhamentos.
        </p>
      </div>
    </div>
  )
}

function ProfessionalProfile() {
  return (
    <div>
      <SectionHeader
        title="Meu perfil profissional"
        description="Edite as informações que aparecem para os usuários."
      />

      <div className="card p-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-stone-600 mb-1 block">Nome profissional</label>
            <input className="input" placeholder="Ex: Dra. Ana Souza" />
          </div>

          <div>
            <label className="text-sm text-stone-600 mb-1 block">Registro profissional</label>
            <input className="input" placeholder="Ex: CRP 00/00000" />
          </div>

          <div>
            <label className="text-sm text-stone-600 mb-1 block">Especialidade</label>
            <input className="input" placeholder="Ex: Psicologia clínica" />
          </div>

          <div>
            <label className="text-sm text-stone-600 mb-1 block">Valor da consulta</label>
            <input className="input" placeholder="Ex: R$ 120,00" />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm text-stone-600 mb-1 block">Descrição</label>
            <textarea
              className="input min-h-28 resize-none"
              placeholder="Fale sobre sua abordagem, experiência e forma de atendimento..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button className="btn-primary">
            Salvar perfil
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfessionalDashboard({ user }) {
  const [activePage, setActivePage] = useState('painel')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'consultas':
        return <ConsultationsPage />
      case 'agenda':
        return <SchedulePage />
      case 'pacientes':
        return <PatientsPage />
      case 'chat':
        return <ChatHistoryPage />
      case 'solicitacoes':
        return <RequestsPage />
      case 'financeiro':
        return <FinancePage />
      case 'relatorios':
        return <ReportsPage />
      case 'perfil':
        return <ProfessionalProfile />
      default:
        return <ProfessionalHome user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(prev => !prev)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-14 left-0 bottom-0 z-40 w-64 bg-stone-50 border-r border-stone-200
        flex flex-col pt-4 pb-6 px-3 transition-transform duration-150 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id)
                setSidebarOpen(false)
              }}
              className={`sidebar-link w-full ${activePage === item.id ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 mt-4">
          <p className="text-xs text-brand-700 leading-relaxed">
            <strong>Área profissional:</strong> gerencie consultas, agenda, pacientes e histórico de atendimento.
          </p>
        </div>
      </aside>

      <main className="pt-14 lg:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
