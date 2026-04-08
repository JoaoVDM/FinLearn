import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal-content fade-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        onClick={e => e.stopPropagation()}
      >
        <AlertTriangle size={36} color={danger ? 'var(--danger)' : 'var(--warning)'} style={{ marginBottom: 12 }} />
        {title && <h3 id="dialog-title" style={{ margin: '0 0 8px', fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h3>}
        <p id="dialog-message" className="text-muted" style={{ margin: '0 0 24px', fontSize: 'var(--text-sm)' }}>{message}</p>
        <div className="button-group-center" style={{ marginTop: 0 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
