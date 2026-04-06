import { useState, useEffect } from 'react'

export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('fl-toast', { detail: { message, type } }))
}

export default function Toast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setToast(e.detail)
      setTimeout(() => setToast(null), 3000)
    }
    window.addEventListener('fl-toast', handler)
    return () => window.removeEventListener('fl-toast', handler)
  }, [])

  if (!toast) return null

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  )
}
