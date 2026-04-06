import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

const LABELS = ['A', 'B', 'C', 'D', 'E']

export default function QuestionCard({ question, answered, chosen, onAnswer, onNext, isLast }) {
  const [nextReady, setNextReady] = useState(false)

  useEffect(() => {
    if (!answered) { setNextReady(false); return }
    const t = setTimeout(() => setNextReady(true), 1500)
    return () => clearTimeout(t)
  }, [answered])

  return (
    <div className="quiz-card card fade-in">
      <p className="quiz-question">{question.question}</p>
      <div className="quiz-options">
        {question.options.map((opt, i) => {
          let cls = 'quiz-option'
          if (answered) {
            if (i === question.correct) cls += ' correct'
            else if (i === chosen) cls += ' wrong'
          } else if (i === chosen) cls += ' selected'
          return (
            <button
              key={i}
              className={cls}
              onClick={() => !answered && onAnswer(i)}
              disabled={answered && i !== chosen && i !== question.correct}
            >
              <span className="option-label">{LABELS[i]}</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {!answered && (
        <div className="quiz-hints">
          <span>Atalhos:</span>
          {LABELS.slice(0, question.options.length).map(k => (
            <kbd key={k} className="kbd">{k}</kbd>
          ))}
          <span style={{ marginLeft: 4 }}>para responder</span>
        </div>
      )}

      {answered && (
        <div className={`quiz-explanation ${chosen === question.correct ? 'correct-bg' : 'wrong-bg'}`}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {chosen === question.correct ? <><CheckCircle size={15} /> Correto!</> : <><XCircle size={15} /> Incorreto</>}
          </strong>
          <p style={{ margin: '8px 0 0' }}>{question.explanation}</p>
        </div>
      )}

      {answered && (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onNext} disabled={!nextReady} style={{ opacity: nextReady ? 1 : 0.45, transition: 'opacity 0.3s' }}>
            {isLast ? 'Ver resultado →' : 'Próxima →'}
          </button>
          {nextReady && (
            <div className="quiz-hints" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
              <kbd className="kbd">Enter</kbd><span>para continuar</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
