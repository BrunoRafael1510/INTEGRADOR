// src/components/PostCard.jsx
import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../services/firebase'
import { moderarTexto, reformularResposta } from '../services/ai'

const CATEGORY_COLORS = {
  'Ansiedade': 'bg-purple-50 text-purple-600 border-purple-100',
  'Família':   'bg-orange-50 text-orange-600 border-orange-100',
  'Relacionamentos': 'bg-pink-50 text-pink-600 border-pink-100',
  'Trabalho':  'bg-blue-50 text-blue-600 border-blue-100',
  'Solidão':   'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Luto':      'bg-stone-100 text-stone-600 border-stone-200',
  'Autoestima':'bg-yellow-50 text-yellow-600 border-yellow-100',
  'Outros':    'bg-sage-50 text-sage-600 border-sage-100',
}

function timeAgo(date) {
  if (!date) return ''
  const now = new Date()
  const d = date?.toDate ? date.toDate() : new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function PostCard({ post, currentUser }) {
  const [resposta, setResposta] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)
  const [erroReply, setErroReply] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const respostas = post.respostas || []
  const curtidas = post.curtidas || []
  const jaCurtiu = curtidas.includes(currentUser?.uid)

  const handleCurtir = async () => {
    if (!currentUser) return
    const ref = doc(db, 'posts', post.id)
    if (jaCurtiu) {
      await updateDoc(ref, { curtidas: arrayRemove(currentUser.uid) })
    } else {
      await updateDoc(ref, { curtidas: arrayUnion(currentUser.uid) })
    }
  }

  const handleReformular = async () => {
    if (!resposta.trim()) return
    setLoadingAI(true)
    const sugestao = await reformularResposta(resposta)
    setAiSuggestion(sugestao)
    setLoadingAI(false)
  }

  const handleEnviarResposta = async () => {
    const texto = aiSuggestion || resposta
    if (!texto.trim()) return
    setLoadingReply(true)
    setErroReply('')
    try {
      const moderacao = await moderarTexto(texto)
      if (!moderacao.ok) {
        setErroReply(`Resposta não permitida: ${moderacao.motivo}`)
        setLoadingReply(false)
        return
      }
      const ref = doc(db, 'posts', post.id)
      await updateDoc(ref, {
        respostas: arrayUnion({
          id: Date.now().toString(),
          texto,
          autorUid: currentUser?.uid || 'anon',
          autorNome: currentUser?.displayName || 'Anônimo',
          criadaEm: new Date().toISOString(),
          curtidas: [],
        }),
        totalRespostas: increment(1),
      })
      setResposta('')
      setAiSuggestion('')
      setShowReply(false)
    } catch (e) {
      setErroReply('Erro ao enviar resposta.')
    } finally {
      setLoadingReply(false)
    }
  }

  const catColor = CATEGORY_COLORS[post.categoria] || 'bg-stone-100 text-stone-600 border-stone-200'

  return (
    <article className="card p-5 hover:shadow-card transition-shadow duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-sage-100 flex items-center justify-center text-stone-400 text-xs font-medium">
            😶
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Anônimo</p>
            <p className="text-xs text-stone-400">{timeAgo(post.criadoEm)}</p>
          </div>
        </div>
        {post.categoria && (
          <span className={`badge border ${catColor}`}>
            {post.categoria}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <p className="text-stone-700 leading-relaxed text-sm mb-4 whitespace-pre-line">
        {post.conteudo}
      </p>

      {/* Ações */}
      <div className="flex items-center gap-4 pt-3 border-t border-stone-50">
        <button
          onClick={handleCurtir}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            jaCurtiu ? 'text-brand-500 font-medium' : 'text-stone-400 hover:text-brand-400'
          }`}
        >
          <span>{jaCurtiu ? '💙' : '🤍'}</span>
          <span>{curtidas.length}</span>
        </button>

        <button
          onClick={() => setShowReply(!showReply)}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          <span>💬</span>
          <span>{respostas.length} respostas</span>
        </button>

        <button className="ml-auto text-xs text-stone-300 hover:text-red-400 transition-colors" title="Denunciar">
          ⚑
        </button>
      </div>

      {/* Respostas existentes */}
      {respostas.length > 0 && (
        <div className="mt-4 space-y-3 pt-3 border-t border-stone-50">
          {respostas.slice(0, 3).map((r) => (
            <div key={r.id} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-sage-50 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                💬
              </div>
              <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-stone-500 mb-0.5">{r.autorNome}</p>
                <p className="text-sm text-stone-700 leading-relaxed">{r.texto}</p>
              </div>
            </div>
          ))}
          {respostas.length > 3 && (
            <p className="text-xs text-stone-400 text-center">
              +{respostas.length - 3} respostas
            </p>
          )}
        </div>
      )}

      {/* Formulário de resposta */}
      {showReply && (
        <div className="mt-4 pt-3 border-t border-stone-50 space-y-3 animate-slide-up">
          <textarea
            value={resposta}
            onChange={(e) => { setResposta(e.target.value); setAiSuggestion('') }}
            placeholder="Escreva sua resposta com empatia..."
            className="input-field text-sm"
            rows={3}
          />

          {aiSuggestion && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
              <p className="text-xs text-brand-500 font-medium mb-1">✨ Sugestão mais empática:</p>
              <p className="text-sm text-stone-700">{aiSuggestion}</p>
              <button
                onClick={() => { setResposta(aiSuggestion); setAiSuggestion('') }}
                className="text-xs text-brand-600 hover:underline mt-1"
              >
                Usar esta versão
              </button>
            </div>
          )}

          {erroReply && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{erroReply}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleReformular}
              disabled={!resposta.trim() || loadingAI}
              className="btn-ghost text-xs gap-1.5 flex items-center"
            >
              {loadingAI ? '...' : '✨ Tornar mais empático'}
            </button>
            <button
              onClick={handleEnviarResposta}
              disabled={(!resposta.trim() && !aiSuggestion) || loadingReply}
              className="btn-primary text-xs ml-auto"
            >
              {loadingReply ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
