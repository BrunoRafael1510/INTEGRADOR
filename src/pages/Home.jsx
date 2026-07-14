import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import PostCard from '../components/PostCard'
import Icon from '../components/Icon'
import { CATEGORY_FILTERS } from '../constants/options'

const CATEGORIAS = CATEGORY_FILTERS

export default function Home({ user }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Todas')

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('criadoEm', 'desc'), limit(30))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPosts(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar feed:', error)
        setPosts([])
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const filtered = filtro === 'Todas' ? posts : posts.filter(p => p.categoria === filtro)

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-full mb-3">
          <Icon name="message" className="w-3.5 h-3.5" />
          Comunidade anonima
        </span>
        <h1 className="font-serif text-2xl text-stone-900 mb-1">Feed de desabafos</h1>
        <p className="text-stone-500 text-sm">Leia, apoie e responda com empatia.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
              filtro === cat
                ? 'bg-brand-600 text-stone-50 border-brand-600'
                : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:border-brand-200 hover:text-brand-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100" />
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-stone-100 rounded" />
                  <div className="h-2 w-10 bg-stone-100 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-4/5" />
                <div className="h-3 bg-stone-100 rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-500 mx-auto mb-4 flex items-center justify-center">
            <Icon name="message" className="w-6 h-6" />
          </div>
          <p className="font-serif text-lg text-stone-800 mb-1">Nenhum desabafo ainda</p>
          <p className="text-stone-400 text-sm">Seja o primeiro a compartilhar algo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} />
          ))}
        </div>
      )}
    </div>
  )
}
