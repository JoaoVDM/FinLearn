import { useEffect, useReducer, useRef } from 'react'
import { Check, ClipboardList } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getQuiz, postQuizScore } from '../../services/api.js'
import { shuffleOptions } from '../../utils/finance.js'
import { useProgress } from '../../context/ProgressContext.jsx'
import QuestionCard from './QuestionCard.jsx'
import QuizResult from './QuizResult.jsx'
import Spinner from '../../components/Spinner.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'

const initialState = { questions: [], current: 0, answers: [], answered: false, loading: true, done: false, started: false }

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED': return { ...state, questions: action.questions, loading: false }
    case 'START': return { ...state, started: true }
    case 'ANSWER': {
      if (state.answered) return state
      const answers = [...state.answers, action.chosen]
      return { ...state, answered: true, answers }
    }
    case 'NEXT': {
      const next = state.current + 1
      if (next >= state.questions.length) return { ...state, done: true }
      return { ...state, current: next, answered: false }
    }
    case 'RESTART': return { ...initialState, loading: false, questions: shuffleOptions(state.questions.map(q => ({ ...q }))) }
    default: return state
  }
}

export default function Quiz() {
  const { modulo } = useParams()
  const { refreshProgress, progress } = useProgress()
  const [state, dispatch] = useReducer(reducer, initialState)
  const nextReadyRef = useRef(true)

  useEffect(() => {
    getQuiz(modulo).then(data => {
      if (data.error) { dispatch({ type: 'LOADED', questions: [] }); return }
      const questions = data.questions || data
      if (!Array.isArray(questions) || !questions.length) return
      dispatch({ type: 'LOADED', questions: shuffleOptions(questions) })
    })
  }, [modulo])

  useEffect(() => {
    if (state.done || state.loading) return
    const handler = (e) => {
      const keys = { a: 0, b: 1, c: 2, d: 3, e: 4 }
      if (e.key.toLowerCase() in keys && !state.answered) {
        const idx = keys[e.key.toLowerCase()]
        if (idx < state.questions[state.current].options.length) dispatch({ type: 'ANSWER', chosen: idx })
      }
      if (e.key === 'Enter' && state.answered && nextReadyRef.current) dispatch({ type: 'NEXT' })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.done, state.loading, state.answered, state.current, state.questions])

  useEffect(() => {
    if (!state.answered) return
    nextReadyRef.current = false
    const t = setTimeout(() => { nextReadyRef.current = true }, 1500)
    return () => clearTimeout(t)
  }, [state.answered, state.current])

  useEffect(() => {
    if (state.done && state.questions.length > 0) {
      const score = state.answers.filter((a, i) => a === state.questions[i].correct).length
      const wrongItems = state.questions
        .map((q, i) => ({
          question: q.question,
          chosen: q.options[state.answers[i]],
          correct: q.options[q.correct],
          explanation: q.explanation
        }))
        .filter((_, i) => state.answers[i] !== state.questions[i].correct)
      postQuizScore(modulo, score, state.questions.length, state.answers, wrongItems).then(() => {
        refreshProgress()
      })
    }
  }, [state.done])

  if (state.loading) return <Spinner />

  if (!state.loading && state.questions.length === 0) {
    return (
      <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>Quiz não encontrado ou indisponível.</p>
      </div>
    )
  }

  if (!state.started) {
    const prevScore = progress?.quizScores?.[modulo]
    return (
      <div className="page-content fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <ClipboardList size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
          <h2 style={{ margin: '0 0 8px' }}>Quiz — Módulo {modulo}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: prevScore ? 12 : 24 }}>
            {state.questions.length} questões de múltipla escolha.<br />
            Use o teclado (A–E) para responder e Enter para avançar.
          </p>
          {prevScore && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Sua última tentativa: <strong style={{ color: prevScore.percent >= 60 ? 'var(--accent)' : 'var(--danger)' }}>{prevScore.percent}% ({prevScore.score}/{prevScore.total})</strong>
              {prevScore.percent < 100 && <span> — refazer vai atualizar o resultado</span>}
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => dispatch({ type: 'START' })}>
            {prevScore ? 'Refazer Quiz' : 'Começar Quiz'}
          </button>
        </div>
      </div>
    )
  }

  if (state.done) {
    return <QuizResult questions={state.questions} answers={state.answers} modulo={modulo} totalModules={5} onRestart={() => dispatch({ type: 'RESTART' })} />
  }

  const q = state.questions[state.current]
  const score = state.answers.filter((a, i) => a === state.questions[i].correct).length

  return (
    <div className="page-content fade-in">
      <div className="quiz-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Questão {state.current + 1} de {state.questions.length}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> {score} corretas</span>
        </div>
        <ProgressBar percent={(state.current / state.questions.length) * 100} />
      </div>
      <QuestionCard
        question={q}
        answered={state.answered}
        chosen={state.answers[state.current] ?? null}
        onAnswer={(idx) => dispatch({ type: 'ANSWER', chosen: idx })}
        onNext={() => dispatch({ type: 'NEXT' })}
        isLast={state.current === state.questions.length - 1}
      />
    </div>
  )
}
