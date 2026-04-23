import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

let _nextId = 0

export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('fl-toast', { detail: { message, type, id: ++_nextId } }))
}

export default function Toast() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { id, message, type } = e.detail
      setToasts(prev => [...prev.slice(-2), { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), 3500)
    }
    window.addEventListener('fl-toast', handler)
    return () => {
      window.removeEventListener('fl-toast', handler)
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [dismiss])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-message">{t.message}</span>
          <button className="toast-dismiss" onClick={() => dismiss(t.id)} aria-label="Fechar notificação">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
