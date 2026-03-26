// src/pages/MyPosts.jsx
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import PostCard from '../components/PostCard'

export default function MyPosts({ user }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletando, setDeletando] = useState(null)

  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'posts'),
      where('autorUid', '==', user.uid),
      orderBy('criadoEm', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user])

  const handleDeletar = async (id) => {
    if (!window.confirm('Deseja remover este desabafo?')) return
    setDeletando(id)
    try {
      await deleteDoc(doc(db, 'posts', id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeletando(null)
    }
  }

  const totalRespostas = posts.reduce((acc, p) => acc + (p.respostas?.length || 0), 0)
  const totalCurtidas = posts.reduce((acc, p) => acc + (p.curtidas?.length || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-stone-900 mb-1">Meus desabafos</h1>
        <p className="text-stone-500 text-sm">Tudo que você compartilhou, em um só lugar.</p>
      </div>

      {/* Stats */}
      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Publicados', value: posts.length, icon: '📝' },
            { label: 'Respostas recebidas', value: totalRespostas, icon: '💬' },
            { label: 'Curtidas', value: totalCurtidas, icon: '💙' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 text-center">
              <p className="text-xl mb-1">{stat.icon}</p>
              <p className="font-serif text-2xl text-stone-800">{stat.value}</p>
              <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 bg-stone-100 rounded w-full mb-2" />
              <div className="h-3 bg-stone-100 rounded w-4/5 mb-2" />
              <div className="h-3 bg-stone-100 rounded w-3/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-serif text-lg text-stone-700 mb-1">Você ainda não publicou nada</p>
          <p className="text-stone-400 text-sm">Quando quiser desabafar, estamos aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="relative group">
              <PostCard post={post} currentUser={user} />
              <button
                onClick={() => handleDeletar(post.id)}
                disabled={deletando === post.id}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-stone-300 hover:text-red-400 bg-white px-2 py-1 rounded-lg border border-stone-100 shadow-sm"
              >
                {deletando === post.id ? '...' : 'Remover'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
