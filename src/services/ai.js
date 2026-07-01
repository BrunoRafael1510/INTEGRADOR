const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama3-8b-8192'

async function callGroq(messages, temperature = 0.7) {
  if (!GROQ_API_KEY) {
    console.warn('[AI] VITE_GROQ_API_KEY nao configurada.')
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

export async function moderarTexto(texto) {
  try {
    const resultado = await callGroq([
      {
        role: 'system',
        content: `Voce e um moderador de uma plataforma de apoio emocional. Analise o texto e determine se ele e ofensivo, prejudicial ou inadequado.
Textos com linguagem emocional, desabafos, palavroes usados para expressar sentimentos e criticas sao permitidos.
Textos com ataques pessoais, discurso de odio, conteudo violento, incentivo a automutilacao ou suicidio sao proibidos.
Responda apenas com JSON: {"ok": true} ou {"ok": false, "motivo": "explicacao curta"}`,
      },
      { role: 'user', content: texto },
    ], 0.2)

    if (!resultado) return { ok: true }
    return JSON.parse(resultado)
  } catch (e) {
    console.error('[AI] Erro na moderacao:', e)
    return { ok: true }
  }
}

export async function reformularResposta(texto) {
  try {
    const resultado = await callGroq([
      {
        role: 'system',
        content: `Voce e um assistente especialista em comunicacao empatica para uma plataforma de apoio emocional.
Sua tarefa e reformular a resposta abaixo para que seja mais acolhedora, compreensiva e gentil.
Mantenha a essencia e a intencao original. Nao adicione informacoes novas. Nao seja artificial ou excessivamente formal.
Responda apenas com o texto reformulado, sem explicacoes ou aspas.`,
      },
      { role: 'user', content: texto },
    ])

    return resultado || texto
  } catch (e) {
    console.error('[AI] Erro na reformulacao:', e)
    return texto
  }
}
