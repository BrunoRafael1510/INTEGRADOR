// src/pages/Dashboard.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import Home from './Home'
import CreatePost from '../components/CreatePost'
import Professionals from './Professionals'
import MyPosts from './MyPosts'

// Mapeia a URL para o ID de página da sidebar
function urlToPage(pathname) {
  if (pathname.includes('criar'))        return 'create'
  if (pathname.includes('profissionais')) return 'professionals'
  if (pathname.includes('meus'))         return 'myposts'
  return 'home'
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [activePage, setActivePage] = useState(urlToPage(location.pathname))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavigate = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
    const paths = {
      home:          '/dashboard',
      create:        '/dashboard/criar',
      professionals: '/dashboard/profissionais',
      myposts:       '/dashboard/meus-desabafos',
    }
    navigate(paths[page] || '/dashboard')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'create':        return <CreatePost user={user} onSuccess={() => handleNavigate('home')} />
      case 'professionals': return <Professionals />
      case 'myposts':       return <MyPosts user={user} />
      default:              return <Home user={user} />
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navbar fixa no topo */}
      <Navbar user={user} onMenuToggle={() => setSidebarOpen(prev => !prev)} />

      {/* Sidebar fixa à esquerda */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteúdo principal — margem para não sobrepor sidebar e navbar */}
      <main className="pt-14 lg:pl-56 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
