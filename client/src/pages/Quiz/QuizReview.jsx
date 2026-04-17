import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { XCircle, CheckCircle, ChevronLeft, Trophy, BookOpen } from 'lucide-react'
import { getQuizReview } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'

export default function QuizReview() {
  const { modulo } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQuizReview(modulo).then(res => {
      if (!res.error) setData(res)
      setLoading(false)
    })
  }, [modulo])

  if (loading) return <Spinner />

  if (!data) {
    return (
      <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ color: 'var(--text-muted)' }}>Nenhuma tentativa encontrada para este módulo.</p>
        <Link to="/trilha" className="btn btn-secondary" style={{ marginTop: 16 }}>
          <ChevronLeft size={14} /> Trilha
        </Link>
      </div>
    )
  }

  const { score, total, percent, wrongItems, completedAt } = data
  const date = completedAt ? new Date(completedAt).toLocaleDateString('pt-BR') : null

  return (
    <div className="page-content fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/trilha" className="btn btn-secondary btn-sm">
          <ChevronLeft size={14} /> Trilha
        </Link>
        <div>
          <h2 style={{ margin: 0 }}>Revisão — Módulo {modulo}</h2>
          {date && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Última tentativa: {date}</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: percent >= 60 ? 'var(--accent)' : 'var(--danger)', lineHeight: 1 }}>{percent}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{score}/{total} acertos</div>
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        {wrongItems.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
            <Trophy size={18} /> <span style={{ fontWeight: 600 }}>Gabarito perfeito!</span>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <strong style={{ color: 'var(--danger)' }}>{wrongItems.length}</strong> {wrongItems.length === 1 ? 'erro' : 'erros'} para revisar
          </div>
        )}
      </div>

      {wrongItems.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <BookOpen size={36} color="var(--accent)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Você acertou todas as questões nesta tentativa. Não há erros para revisar.</p>
        </div>
      ) : (
        <div>
          <h3 className="section-title">Questões erradas ({wrongItems.length})</h3>
          {wrongItems.map((item, i) => (
            <div key={i} className="card wrong-answer-card">
              <p className="wrong-answer-question">{item.question}</p>
              <p className="wrong-answer-yours">
                <XCircle size={14} /> Sua resposta: {item.chosen}
              </p>
              <p className="wrong-answer-correct">
                <CheckCircle size={14} /> Correto: {item.correct}
              </p>
              {item.explanation && (
                <p className="wrong-answer-explanation">{item.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="button-group-center" style={{ marginTop: 24 }}>
        <Link to={`/quiz/${modulo}`} className="btn btn-primary">Refazer Quiz</Link>
        <Link to="/trilha" className="btn btn-secondary"><ChevronLeft size={14} /> Trilha</Link>
      </div>
    </div>
  )
}
