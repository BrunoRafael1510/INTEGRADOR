import { Suspense, lazy, useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { auth, db } from '../services/firebase'

const Home = lazy(() => import('./Home'))
const ProfessionalHome = lazy(() => import('./ProfessionalHome'))
const CreatePost = lazy(() => import('../components/CreatePost'))
const Professionals = lazy(() => import('./Professionals'))
const MyPosts = lazy(() => import('./MyPosts'))

function urlToPage(pathname) {
  if (pathname.includes('criar')) return 'create'
  if (pathname.includes('profissionais')) return 'professionals'
  if (pathname.includes('meus')) return 'myposts'
  if (pathname.includes('feed-comunidade')) return 'community'
  return 'home'
}

const ROUTE_PATHS = {
  home: '/dashboard',
  create: '/dashboard/criar',
  professionals: '/dashboard/profissionais',
  myposts: '/dashboard/meus-desabafos',
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
    </div>
  )
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activePageBase = urlToPage(location.pathname)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])

  useEffect(() => {
    let active = true

    async function loadProfile() {
      if (!user?.uid) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (active) setProfile(snap.exists() ? snap.data() : null)
      } catch (error) {
        console.error(error)
        if (active) setProfile(null)
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [user?.uid])

  const handleNavigate = useCallback(
    async (page) => {
      if (page === 'logout') {
        await signOut(auth)
        navigate('/')
        return
      }

      setSidebarOpen(false)
      const professionalAnchors = ['profile', 'requests', 'answer', 'reviews', 'schedule', 'stats', 'settings']
      if (professionalAnchors.includes(page)) {
        navigate(`/dashboard#${page}`)
        return
      }

      if (page === 'community') {
        navigate('/dashboard/feed-comunidade')
        return
      }

      navigate(ROUTE_PATHS[page] || ROUTE_PATHS.home)
    },
    [navigate]
  )

  const isProfessional = profile?.tipo === 'profissional'
  const activePage = isProfessional && location.hash ? location.hash.replace('#', '') : activePageBase

  useEffect(() => {
    if (!location.hash) return

    window.setTimeout(() => {
      document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [location.hash])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={user} onMenuToggle={toggleSidebar} />

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        profile={profile}
      />

      <main className={`pt-14 ${isProfessional ? 'lg:pl-64' : 'lg:pl-56'} min-h-screen`}>
        <div className={`${isProfessional ? 'max-w-7xl' : 'max-w-2xl'} mx-auto px-4 py-8 animate-fade-in`}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                index
                element={
                  profileLoading ? (
                    <PageFallback />
                  ) : profile?.tipo === 'profissional' ? (
                    <ProfessionalHome user={user} profile={profile} onNavigate={(target) => {
                      if (target === 'community') navigate('/dashboard/feed-comunidade')
                      if (target === 'profile') navigate('/dashboard#profile')
                      if (target === 'requests') navigate('/dashboard#requests')
                      if (target === 'schedule') navigate('/dashboard#schedule')
                    }} />
                  ) : (
                    <Home user={user} />
                  )
                }
              />
              <Route path="feed-comunidade" element={<Home user={user} />} />
              <Route
                path="criar"
                element={<CreatePost user={user} onSuccess={() => handleNavigate('home')} />}
              />
              <Route path="profissionais" element={<Professionals />} />
              <Route path="meus-desabafos" element={<MyPosts user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
