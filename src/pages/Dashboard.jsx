import { Suspense, lazy, useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'

import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { auth, db } from '../services/firebase'

const Home = lazy(() => import('./Home'))
const ProfessionalHome = lazy(() => import('./ProfessionalHome'))
const CreatePost = lazy(() => import('../components/CreatePost'))
const Professionals = lazy(() => import('./Professionals'))
const MyPosts = lazy(() => import('./MyPosts'))
const PatientReviews = lazy(() => import('./PatientReviews'))
const PatientSessions = lazy(() => import('./PatientSessions'))

const ROUTE_PATHS = {
  home: '/dashboard',
  create: '/dashboard/criar',
  professionals: '/dashboard/profissionais',
  myposts: '/dashboard/meus-desabafos',
  patientSessions: '/dashboard/atendimentos',
  patientReviews: '/dashboard/avaliacoes',
  community: '/dashboard/feed-comunidade',
}

const PROFESSIONAL_PAGES = ['profile', 'requests', 'sessions', 'community', 'answer', 'reviews', 'schedule', 'stats', 'settings']

function urlToPage(pathname, hash, isProfessional) {
  if (isProfessional && hash) return hash.replace('#', '')
  if (pathname.includes('criar')) return 'create'
  if (pathname.includes('profissionais')) return 'professionals'
  if (pathname.includes('atendimentos')) return 'patientSessions'
  if (pathname.includes('avaliacoes')) return 'patientReviews'
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

function reviewKey(review) {
  return review.atendimentoId || `${review.profissionalUid}-${review.origem || 'diretorio'}`
}

export default function Dashboard({ user, theme = 'light', onThemeToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [navCounts, setNavCounts] = useState({})
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

  useEffect(() => {
    if (!user?.uid || profileLoading) {
      setNavCounts({})
      return undefined
    }

    const isProfessionalProfile = profile?.tipo === 'profissional'
    const field = isProfessionalProfile ? 'profissionalUid' : 'pacienteUid'
    let requests = []
    let reviews = []
    let appointments = []
    let messages = []
    let stopped = false

    const recomputeCounts = () => {
      if (stopped) return

      const activeRequestIds = new Set(
        requests
          .filter((request) => request.status === 'aceita')
          .map((request) => String(request.id))
      )
      const unreadMessages = messages.filter((message) => {
        const sessionId = String(message.atendimentoId || message.requestId || '')
        return (
          activeRequestIds.has(sessionId) &&
          message.senderUid !== user.uid &&
          !(message.readBy || []).includes(user.uid)
        )
      }).length

      if (isProfessionalProfile) {
        setNavCounts((current) => ({
          ...current,
          requests: requests.filter((request) => ['nova', 'pendente'].includes(request.status || 'nova')).length,
          sessions: unreadMessages,
        }))
        return
      }

      const reviewed = new Set(reviews.map(reviewKey))
      const finalizedRequests = requests.filter((request) => request.status === 'finalizada' && request.profissionalUid)
      const finalizedRequestIds = new Set(finalizedRequests.map((request) => String(request.id)))
      const pendingRequestReviews = finalizedRequests.filter((request) => !reviewed.has(request.id)).length
      const pendingAppointmentReviews = appointments.filter((appointment) => {
        const status = appointment.status || ''
        const requestId = appointment.requestId ? String(appointment.requestId) : ''
        return (
          ['concluida', 'finalizada'].includes(status) &&
          appointment.profissionalUid &&
          !reviewed.has(appointment.id) &&
          (!requestId || !finalizedRequestIds.has(requestId))
        )
      }).length

      setNavCounts((current) => ({
        ...current,
        patientSessions: unreadMessages,
        patientReviews: pendingRequestReviews + pendingAppointmentReviews,
      }))
    }

    const unsubs = [
      onSnapshot(
        query(collection(db, 'requests'), where(field, '==', user.uid)),
        (snap) => {
          requests = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
          recomputeCounts()
        },
        (error) => {
          console.error('Erro ao carregar notificacoes do menu:', error)
          requests = []
          recomputeCounts()
        }
      ),
      onSnapshot(
        query(collection(db, 'messages'), where(field, '==', user.uid)),
        (snap) => {
          messages = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
          recomputeCounts()
        },
        (error) => {
          console.error('Erro ao carregar mensagens nao lidas:', error)
          messages = []
          recomputeCounts()
        }
      ),
    ]

    if (!isProfessionalProfile) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'reviews'), where('pacienteUid', '==', user.uid)),
          (snap) => {
            reviews = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
            recomputeCounts()
          },
          (error) => {
            console.error('Erro ao carregar avaliacoes do menu:', error)
            reviews = []
            recomputeCounts()
          }
        )
      )
      unsubs.push(
        onSnapshot(
          query(collection(db, 'appointments'), where('pacienteUid', '==', user.uid)),
          (snap) => {
            appointments = snap.docs.map((item) => ({ id: item.id, ...item.data() }))
            recomputeCounts()
          },
          (error) => {
            console.error('Erro ao carregar agenda do menu:', error)
            appointments = []
            recomputeCounts()
          }
        )
      )
    }

    return () => {
      stopped = true
      unsubs.forEach((unsubscribe) => unsubscribe())
    }
  }, [profile?.tipo, profileLoading, user?.uid])

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
        navCounts={navCounts}
      />

      <main className="min-h-screen pt-14 lg:pl-[68px]">
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
              <Route path="atendimentos" element={<PatientSessions user={user} />} />
              <Route path="avaliacoes" element={<PatientReviews user={user} />} />
              <Route path="meus-desabafos" element={<MyPosts user={user} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
