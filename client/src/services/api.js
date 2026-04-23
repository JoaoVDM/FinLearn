const BASE = ''

async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  try {
    const res = await fetch(BASE + path, opts)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error(`[API] ${method} ${path} → HTTP ${res.status}`, data)
      return { error: true, status: res.status, message: data.error || `HTTP ${res.status}` }
    }
    return data
  } catch (err) {
    console.error(`[API] ${method} ${path} → Erro de rede:`, err.message)
    return { error: true, status: 0, message: 'Erro de rede. Verifique sua conexão.' }
  }
}

export const getProgress = () => req('GET', '/api/progresso')
export const postProgress = (lessonId, completed) => req('POST', '/api/progresso', { lessonId, completed })
export const resetProgress = () => req('POST', '/api/progresso/reset')
export const getModules = () => req('GET', '/api/content/modules')
export const getLesson = (id) => req('GET', `/api/content/lesson/${id}`)
export const getGlossary = () => req('GET', '/api/content/glossary')
export const getQuiz = (modulo) => req('GET', `/api/quiz/${modulo}`)
export const postQuizScore = (modulo, score, total, answers, wrongItems) => req('POST', `/api/quiz/${modulo}`, { score, total, answers, wrongItems })
export const getQuizReview = (modulo) => req('GET', `/api/quiz/${modulo}/review`)
export const getFluxo = () => req('GET', '/api/fluxo')
export const postFluxo = (type, description, value, date, category) => req('POST', '/api/fluxo', { type, description, value, date, category })
export const getAllNotas = () => req('GET', '/api/notes')
export const getNota = (lessonId) => req('GET', `/api/notes/${lessonId}`)
export const saveNota = (lessonId, text) => req('POST', `/api/notes/${lessonId}`, { text })
export const deleteNota = (lessonId) => req('DELETE', `/api/notes/${lessonId}`)
export const editFluxo = (id, type, description, value, date, category) => req('PUT', `/api/fluxo/${id}`, { type, description, value, date, category })
export const deleteFluxo = (id) => req('DELETE', `/api/fluxo/${id}`)
export const getBudgets = () => req('GET', '/api/budgets')
export const saveBudgets = (budgets) => req('POST', '/api/budgets', { budgets })
export const getRecurring = () => req('GET', '/api/recurring')
export const addRecurring = (type, description, value, category) => req('POST', '/api/recurring', { type, description, value, category })
export const deleteRecurring = (id) => req('DELETE', `/api/recurring/${id}`)
export const generateRecurring = (month) => req('POST', `/api/recurring/generate/${month}`)
export const searchGlobal = (q) => req('GET', `/api/search?q=${encodeURIComponent(q)}`)
export const getGoals = () => req('GET', '/api/goals')
export const addGoal = (data) => req('POST', '/api/goals', data)
export const updateGoal = (id, data) => req('PUT', `/api/goals/${id}`, data)
export const deleteGoal = (id) => req('DELETE', `/api/goals/${id}`)
