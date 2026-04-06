import { Menu, TrendingUp } from 'lucide-react'

export default function MobileHeader({ onMenuClick }) {
  return (
    <header className="mobile-header">
      <button className="hamburger" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} />
      </button>
      <span className="mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <TrendingUp size={18} />
        FinLearn
      </span>
    </header>
  )
}
