import { Suspense, lazy, useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { auth, db } from '../services/firebase'

const Home = lazy(() => import('./Home'))
const ProfessionalHome = lazy(() => import('./ProfessionalHome'))
const CreatePost = lazy(() => import('../components/CreatePost'))
const Professionals = lazy(() => import('./Professionals'))
const MyPosts = lazy(() => import('./MyPosts'))

const ROUTE_PATHS = {
  home: '/dashboard',
  create: '/dashboard/criar',
  professionals: '/dashboard/profissionais',
  myposts: '/dashboard/meus-desabafos',
  community: '/dashboard/feed-comunidade',
}

const PROFESSIONAL_PAGES = ['profile', 'requests', 'community', 'answer', 'reviews', 'schedule', 'stats', 'settings']

function urlToPage(pathname, hash, isProfessional) {
  if (isProfessional && hash) return hash.replace('#', '')
  if (pathname.includes('criar')) return 'create'
  if (pathname.includes('profissionais')) return 'professionals'
  if (pathname.includes('meus')) return 'myposts'
  if (pathname.includes('feed-comunidade')) return 'community'
  return 'home'
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
    </div>
  )
}

export default function Dashboard({ user, theme = 'light', onThemeToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null)
      setProfileLoading(false)
      return undefined
    }

    setProfileLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setProfileLoading(false)
      },
      (error) => {
        console.error(error)
        setProfile(null)
        setProfileLoading(false)
      }
    )

    return unsubscribe
  }, [user?.uid])

  const isProfessional = profile?.tipo === 'profissional'
  const activePage = urlToPage(location.pathname, location.hash, isProfessional)

  const handleNavigate = useCallback(
    async (page) => {
      setSidebarOpen(false)

      if (page === 'logout') {
        await signOut(auth)
        navigate('/')
        return
      }

      if (PROFESSIONAL_PAGES.includes(page)) {
        navigate(page === 'community' ? ROUTE_PATHS.community : `/dashboard#${page}`)
        return
      }

      navigate(ROUTE_PATHS[page] || ROUTE_PATHS.home)
    },
    [navigate]
  )

  return (
    <div className="app-bg min-h-screen">
      <Navbar user={user} onMenuToggle={toggleSidebar} theme={theme} onThemeToggle={onThemeToggle} />

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        profile={profile}
      />

      <main className={`min-h-screen pt-14 ${isProfessional ? 'lg:pl-64' : 'lg:pl-56'}`}>
        <div className={`${isProfessional ? 'max-w-7xl' : 'max-w-2xl'} mx-auto px-4 py-8 animate-fade-in`}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                index
                element={
                  profileLoading ? (
                    <PageFallback />
                  ) : isProfessional ? (
                    <ProfessionalHome
                      user={user}
                      profile={profile}
                      activePage={activePage}
                      onNavigate={handleNavigate}
                    />
                  ) : (
                    <Home user={user} />
                  )
                }
              />
              <Route path="feed-comunidade" element={<Home user={user} />} />
              <Route path="criar" element={<CreatePost user={user} onSuccess={() => handleNavigate('home')} />} />
              <Route path="profissionais" element={<Professionals user={user} viewerProfile={profile} />} />
              <Route path="meus-desabafos" element={<MyPosts user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
