import { useState } from 'react'
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../services/firebase'
import { moderarTexto, reformularResposta } from '../services/ai'
import Icon from './Icon'

const CATEGORY_COLORS = {
  Ansiedade: 'bg-violet-50 text-violet-700 border-violet-100',
  Familia: 'bg-orange-50 text-orange-700 border-orange-100',
  Relacionamentos: 'bg-rose-50 text-rose-700 border-rose-100',
  Trabalho: 'bg-blue-50 text-blue-700 border-blue-100',
  Solidao: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  Luto: 'bg-stone-100 text-stone-700 border-stone-200',
  Autoestima: 'bg-amber-50 text-amber-700 border-amber-100',
  Outros: 'bg-sage-50 text-sage-700 border-sage-100',
}

function normalizeCategory(category) {
  const map = {
    'Família': 'Familia',
    'Solidão': 'Solidao',
  }
  return map[category] || category
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
  const categoria = normalizeCategory(post.categoria)

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
        setErroReply(`Resposta nao permitida: ${moderacao.motivo}`)
        setLoadingReply(false)
        return
      }
      const ref = doc(db, 'posts', post.id)
      await updateDoc(ref, {
        respostas: arrayUnion({
          id: Date.now().toString(),
          texto,
          autorUid: currentUser?.uid || 'anon',
          autorNome: currentUser?.displayName || 'Anonimo',
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

  const catColor = CATEGORY_COLORS[categoria] || 'bg-stone-100 text-stone-600 border-stone-200'

  return (
    <article className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600/10 to-cyan-500/10 border border-white/70 flex items-center justify-center text-brand-700 shadow-sm">
            <Icon name="shield" className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Anonimo</p>
            <p className="text-xs text-stone-400">{timeAgo(post.criadoEm)}</p>
          </div>
        </div>
        {categoria && (
          <span className={`badge border ${catColor}`}>
            {categoria}
          </span>
        )}
      </div>

      <p className="text-stone-700 leading-relaxed text-sm mb-4 whitespace-pre-line">
        {post.conteudo}
      </p>

      <div className="flex items-center gap-4 pt-3 border-t border-stone-100">
        <button
          onClick={handleCurtir}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            jaCurtiu ? 'text-brand-600 font-medium' : 'text-stone-400 hover:text-brand-500'
          }`}
        >
          <Icon name="heart" className="w-4 h-4" filled={jaCurtiu} />
          <span>{curtidas.length}</span>
        </button>

        <button
          onClick={() => setShowReply(!showReply)}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Icon name="message" className="w-4 h-4" />
          <span>{respostas.length} respostas</span>
        </button>

        <button className="ml-auto text-xs text-stone-300 hover:text-red-500 transition-colors" title="Denunciar" aria-label="Denunciar">
          <Icon name="flag" className="w-4 h-4" />
        </button>
      </div>

      {respostas.length > 0 && (
        <div className="mt-4 space-y-3 pt-3 border-t border-stone-100">
          {respostas.slice(0, 3).map((r) => (
            <div key={r.id} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="message" className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 bg-white/65 border border-white/70 rounded-lg px-3 py-2 backdrop-blur-xl">
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

      {showReply && (
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-3 animate-slide-up">
          <textarea
            value={resposta}
            onChange={(e) => { setResposta(e.target.value); setAiSuggestion('') }}
            placeholder="Escreva uma resposta com empatia..."
            className="input-field text-sm"
            rows={3}
          />

          {aiSuggestion && (
            <div className="bg-gradient-to-br from-brand-50 to-cyan-50 border border-white/70 rounded-lg p-3 shadow-sm">
              <p className="text-xs text-brand-600 font-medium mb-1 flex items-center gap-1.5">
                <Icon name="spark" className="w-3.5 h-3.5" />
                Sugestao mais empatica
              </p>
              <p className="text-sm text-stone-700">{aiSuggestion}</p>
              <button
                onClick={() => { setResposta(aiSuggestion); setAiSuggestion('') }}
                className="text-xs text-brand-600 hover:underline mt-1"
              >
                Usar esta versao
              </button>
            </div>
          )}

          {erroReply && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erroReply}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleReformular}
              disabled={!resposta.trim() || loadingAI}
              className="btn-ghost text-xs gap-1.5"
            >
              <Icon name="spark" className="w-3.5 h-3.5" />
              {loadingAI ? 'Ajustando...' : 'Tornar mais empatico'}
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
