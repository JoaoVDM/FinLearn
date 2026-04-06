import { Link } from 'react-router-dom'
import { Trophy, ClipboardCheck, X } from 'lucide-react'

export default function ModuleCompleteModal({ moduleId, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div className="card fade-in" style={{ maxWidth: 400, width: '100%', padding: 36, textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
        <Trophy size={48} color="var(--warning)" style={{ marginBottom: 16 }} />
        <h2 style={{ margin: '0 0 8px' }}>Módulo concluído!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Você completou todas as lições deste módulo. Que tal testar seu conhecimento?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/quiz/${moduleId}`} className="btn btn-primary" onClick={onClose}>
            <ClipboardCheck size={15} /> Fazer Quiz
          </Link>
          <button className="btn btn-secondary" onClick={onClose}>Continuar depois</button>
        </div>
      </div>
    </div>
  )
}
