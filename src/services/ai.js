// src/services/ai.js
// Integração com Groq API para moderação e reformulação de texto
// Documentação: https://console.groq.com/docs/openai
// ⚠️ Em produção, nunca exponha a API key no frontend. Use uma Cloud Function.

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama3-8b-8192'

async function callGroq(messages, temperature = 0.7) {
  if (!GROQ_API_KEY) {
    console.warn('[AI] VITE_GROQ_API_KEY não configurada.')
    return null
  }

  const res = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: 512 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

/**
 * Verifica se um texto é adequado para a plataforma.
 * Retorna { ok: boolean, motivo: string | null }
 */
export async function moderarTexto(texto) {
  try {
    const resultado = await callGroq([
      {
        role: 'system',
        content: `Você é um moderador de uma plataforma de apoio emocional. Analise o texto e determine se ele é ofensivo, prejudicial ou inadequado.
Textos com linguagem emocional, desabafos, palavrões usados para expressar sentimentos e críticas são PERMITIDOS.
Textos com ataques pessoais, discurso de ódio, conteúdo violento, incentivo a automutilação ou suicídio são PROIBIDOS.
Responda APENAS com JSON: {"ok": true} ou {"ok": false, "motivo": "explicação curta"}`
      },
      { role: 'user', content: texto }
    ], 0.2)

    if (!resultado) return { ok: true }
    const parsed = JSON.parse(resultado)
    return parsed
  } catch (e) {
    console.error('[AI] Erro na moderação:', e)
    return { ok: true } // fallback permissivo se a IA falhar
  }
}

/**
 * Reformula uma resposta para torná-la mais empática e acolhedora,
 * mantendo a essência e o tom original.
 * Retorna string com o texto reformulado.
 */
export async function reformularResposta(texto) {
  try {
    const resultado = await callGroq([
      {
        role: 'system',
        content: `Você é um assistente especialista em comunicação empática para uma plataforma de apoio emocional.
Sua tarefa é reformular a resposta abaixo para que seja mais acolhedora, compreensiva e gentil.
Mantenha a essência e a intenção original. Não adicione informações novas. Não seja artificial ou excessivamente formal.
Responda APENAS com o texto reformulado, sem explicações ou aspas.`
      },
      { role: 'user', content: texto }
    ])

    return resultado || texto
  } catch (e) {
    console.error('[AI] Erro na reformulação:', e)
    return texto
  }
}
