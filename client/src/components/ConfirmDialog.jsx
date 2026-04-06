import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onCancel}>
      <div className="card fade-in" style={{ maxWidth: 380, width: '100%', padding: 28, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <AlertTriangle size={36} color={danger ? 'var(--danger)' : 'var(--warning)'} style={{ marginBottom: 12 }} />
        {title && <h3 style={{ margin: '0 0 8px' }}>{title}</h3>}
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: '0.9rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
