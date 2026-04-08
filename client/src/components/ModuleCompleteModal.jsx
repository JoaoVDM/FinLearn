import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ClipboardCheck, X } from 'lucide-react'

export default function ModuleCompleteModal({ moduleId, onClose }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => c - 1), 1000)
    const redirect = setTimeout(() => navigate(`/quiz/${moduleId}`), 5000)
    return () => { clearInterval(tick); clearTimeout(redirect) }
  }, [moduleId, navigate])

  const goToQuiz = () => navigate(`/quiz/${moduleId}`)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
        <Trophy size={48} color="var(--warning)" style={{ marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 8px' }}>Módulo concluído!</h2>
        <p className="text-muted" style={{ marginBottom: 24, fontSize: 'var(--text-sm)' }}>
          Você completou todas as lições. Que tal testar seu conhecimento agora?
        </p>
        <div className="button-group-center">
          <button className="btn btn-primary" onClick={goToQuiz}>
            <ClipboardCheck size={15} /> Fazer Quiz
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Depois</button>
        </div>
        <p className="text-muted" style={{ marginTop: 16, fontSize: 'var(--text-xs)' }}>
          Redirecionando em {countdown}s...
        </p>
      </div>
    </div>
  )
}
