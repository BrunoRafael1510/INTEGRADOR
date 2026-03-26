// src/components/CreatePost.jsx
import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { moderarTexto } from '../services/ai'

const CATEGORIAS = ['Ansiedade', 'Família', 'Relacionamentos', 'Trabalho', 'Solidão', 'Luto', 'Autoestima', 'Outros']

export default function CreatePost({ user, onSuccess }) {
  const [form, setForm] = useState({ conteudo: '', categoria: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.conteudo.trim()) return
    setLoading(true)
    setErro('')

    try {
      const moderacao = await moderarTexto(form.conteudo)
      if (!moderacao.ok) {
        setErro(`Conteúdo não permitido: ${moderacao.motivo}`)
        setLoading(false)
        return
      }

      await addDoc(collection(db, 'posts'), {
        conteudo: form.conteudo,
        categoria: form.categoria || 'Outros',
        autorUid: user?.uid || 'anon',
        criadoEm: serverTimestamp(),
        respostas: [],
        curtidas: [],
        totalRespostas: 0,
        denuncias: 0,
      })

      setForm({ conteudo: '', categoria: '' })
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
      onSuccess?.()
    } catch (e) {
      setErro('Erro ao publicar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-serif text-xl text-stone-900 mb-1">Novo desabafo</h2>
      <p className="text-stone-500 text-sm mb-5">
        Tudo que você escrever aqui será publicado de forma <strong>completamente anônima</strong>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">O que está pesando?</label>
          <textarea
            value={form.conteudo}
            onChange={(e) => { setForm({ ...form, conteudo: e.target.value }); setErro('') }}
            placeholder="Conte o que você está sentindo, sem filtros. Ninguém vai te julgar aqui..."
            className="input-field"
            rows={5}
            required
            maxLength={2000}
          />
          <p className="text-xs text-stone-400 text-right mt-1">{form.conteudo.length}/2000</p>
        </div>

        <div>
          <label className="label">Categoria (opcional)</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, categoria: form.categoria === cat ? '' : cat })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  form.categoria === cat
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="bg-sage-50 border border-sage-200 text-sage-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            ✅ Desabafo publicado com sucesso!
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-stone-400 flex items-center gap-1">
            🔒 Publicado anonimamente
          </p>
          <button
            type="submit"
            disabled={loading || !form.conteudo.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Publicando...
              </>
            ) : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  )
}
