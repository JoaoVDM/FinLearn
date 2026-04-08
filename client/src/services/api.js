const BASE = ''

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  try {
    const res = await fetch(BASE + path, opts)
    if (!res.ok) {
      console.error(`[API] ${method} ${path} → HTTP ${res.status}`)
      return {}
    }
    return await res.json()
  } catch (err) {
    console.error(`[API] ${method} ${path} → Erro de rede:`, err.message)
    return {}
  }
}

export const getProgress = () => req('GET', '/api/progresso')
export const postProgress = (lessonId, completed) => req('POST', '/api/progresso', { lessonId, completed })
export const resetProgress = () => req('POST', '/api/progresso/reset')
export const getModules = () => req('GET', '/api/content/modules')
export const getLesson = (id) => req('GET', `/api/content/lesson/${id}`)
export const getGlossary = () => req('GET', '/api/content/glossary')
export const getQuiz = (modulo) => req('GET', `/api/quiz/${modulo}`)
export const postQuizScore = (modulo, score, total, answers) => req('POST', `/api/quiz/${modulo}`, { score, total, answers })
export const getFluxo = () => req('GET', '/api/fluxo')
export const postFluxo = (type, description, value, date) => req('POST', '/api/fluxo', { type, description, value, date })
export const deleteFluxo = (id) => req('DELETE', `/api/fluxo/${id}`)
