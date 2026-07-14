import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import PostCard from '../components/PostCard'
import Icon from '../components/Icon'

export default function MyPosts({ user }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletando, setDeletando] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!user?.uid) {
      setPosts([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setErro('')
    const q = query(
      collection(db, 'posts'),
      where('autorUid', '==', user.uid)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const dateA = a.criadoEm?.toDate ? a.criadoEm.toDate().getTime() : new Date(a.criadoEm || 0).getTime()
            const dateB = b.criadoEm?.toDate ? b.criadoEm.toDate().getTime() : new Date(b.criadoEm || 0).getTime()
            return dateB - dateA
          })
        setPosts(data)
        setLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar meus desabafos:', error)
        setErro(error.message || 'Nao foi possivel carregar seus desabafos.')
        setLoading(false)
      }
    )
    return unsub
  }, [user?.uid])

  const handleDeletar = async (id) => {
    if (!window.confirm('Deseja remover este desabafo?')) return
    setDeletando(id)
    setErro('')
    try {
      await deleteDoc(doc(db, 'posts', id))
    } catch (e) {
      console.error('Erro ao remover desabafo:', e)
      setErro(e.message || 'Nao foi possivel remover este desabafo.')
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
        <p className="text-stone-500 text-sm">Tudo que voce compartilhou, em um so lugar.</p>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {erro}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Publicados', value: posts.length, icon: 'file' },
            { label: 'Respostas', value: totalRespostas, icon: 'message' },
            { label: 'Curtidas', value: totalCurtidas, icon: 'heart' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 text-center">
              <Icon name={stat.icon} className="w-5 h-5 mx-auto mb-2 text-brand-600" />
              <p className="font-serif text-2xl text-stone-800">{stat.value}</p>
              <p className="text-xs text-stone-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

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
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-lg bg-stone-100 text-stone-500 mx-auto mb-4 flex items-center justify-center">
            <Icon name="file" className="w-6 h-6" />
          </div>
          <p className="font-serif text-lg text-stone-800 mb-1">Voce ainda nao publicou nada</p>
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
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs text-stone-400 hover:text-red-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200"
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
