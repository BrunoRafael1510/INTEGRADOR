import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { moderarTexto } from '../services/ai'
import Icon from './Icon'

const CATEGORIAS = ['Ansiedade', 'Familia', 'Relacionamentos', 'Trabalho', 'Solidao', 'Luto', 'Autoestima', 'Outros']

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
        setErro(`Conteudo nao permitido: ${moderacao.motivo}`)
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
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 border border-brand-100 flex items-center justify-center">
          <Icon name="edit" className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif text-xl text-stone-900 mb-1">Novo desabafo</h2>
          <p className="text-stone-500 text-sm">
            Tudo que voce escrever aqui sera publicado de forma anonima.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">O que esta pesando?</label>
          <textarea
            value={form.conteudo}
            onChange={(e) => { setForm({ ...form, conteudo: e.target.value }); setErro('') }}
            placeholder="Conte o que voce esta sentindo. Aqui o foco e acolhimento, nao julgamento."
            className="input-field"
            rows={6}
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-150 ${
                  form.categoria === cat
                    ? 'bg-brand-600 text-stone-50 border-brand-600'
                    : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:border-brand-200 hover:text-brand-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="bg-sage-50 border border-sage-200 text-sage-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <Icon name="check" className="w-4 h-4" />
            Desabafo publicado com sucesso.
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-stone-400 flex items-center gap-1.5">
            <Icon name="lock" className="w-3.5 h-3.5" />
            Publicado anonimamente
          </p>
          <button
            type="submit"
            disabled={loading || !form.conteudo.trim()}
            className="btn-primary gap-2"
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
