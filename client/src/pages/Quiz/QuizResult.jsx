import { Link } from 'react-router-dom'
import { Trophy, Star, ThumbsUp, BookOpen, XCircle, CheckCircle, RotateCcw, ChevronLeft } from 'lucide-react'

const RESULT_ICON = {
  100: <Trophy size={40} color="var(--warning)" />,
  80:  <Star size={40} color="var(--accent)" />,
  60:  <ThumbsUp size={40} color="var(--accent)" />,
  0:   <BookOpen size={40} color="var(--text-muted)" />,
}

export default function QuizResult({ questions, answers, modulo, onRestart }) {
  const score   = answers.filter((a, i) => a === questions[i].correct).length
  const total   = questions.length
  const percent = Math.round(score / total * 100)
  const icon    = percent === 100 ? RESULT_ICON[100] : percent >= 80 ? RESULT_ICON[80] : percent >= 60 ? RESULT_ICON[60] : RESULT_ICON[0]
  const msg     = percent === 100 ? 'Perfeito! Você dominou este módulo.' : percent >= 80 ? 'Ótimo resultado! Quase lá.' : percent >= 60 ? 'Bom progresso, continue assim!' : 'Continue estudando e tente novamente.'

  const wrong = questions
    .map((q, i) => ({ ...q, chosen: answers[i] }))
    .filter((_, i) => answers[i] !== questions[i].correct)

  return (
    <div className="page-content fade-in">
      <div className="quiz-result card">
        <span className="quiz-result-emoji">{icon}</span>
        <div className="quiz-result-score">
          {score}<span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{total}</span>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>{percent}% de acerto</div>
        <p className="quiz-result-label">{msg}</p>
        <div className="button-group-center">
          <button className="btn btn-primary" onClick={onRestart}>
            <RotateCcw size={15} /> Refazer Quiz
          </button>
          <Link to={`/trilha?modulo=${modulo}`} className="btn btn-secondary">
            <ChevronLeft size={15} /> Voltar à Trilha
          </Link>
        </div>
      </div>

      {wrong.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 className="section-title">Revisar erros ({wrong.length})</h3>
          {wrong.map((q, i) => (
            <div key={i} className="card wrong-answer-card">
              <p className="wrong-answer-question">{q.question}</p>
              <p className="wrong-answer-yours">
                <XCircle size={14} /> Sua resposta: {q.options[q.chosen]}
              </p>
              <p className="wrong-answer-correct">
                <CheckCircle size={14} /> Correto: {q.options[q.correct]}
              </p>
              <p className="wrong-answer-explanation">{q.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
