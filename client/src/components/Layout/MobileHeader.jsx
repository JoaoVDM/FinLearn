import { Menu, TrendingUp } from 'lucide-react'

export default function MobileHeader({ onMenuClick }) {
  return (
    <header className="mobile-header">
      <button className="hamburger" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <div className="mobile-logo">
        <div className="logo-icon-wrap" style={{ width: 26, height: 26, borderRadius: 7 }}>
          <TrendingUp size={14} color="var(--accent)" strokeWidth={2.5} />
        </div>
        <span>FinLearn</span>
      </div>
      <div style={{ width: 36 }} />
    </header>
  )
}
