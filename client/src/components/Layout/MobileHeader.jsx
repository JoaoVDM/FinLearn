import { Menu, TrendingUp, Search } from 'lucide-react'

export default function MobileHeader({ onMenuClick, onSearchClick }) {
  return (
    <header className="mobile-header">
      <button className="hamburger" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={20} />
      </button>
      <div className="mobile-logo">
        <div className="logo-icon-wrap" style={{ width: 28, height: 28, borderRadius: 7 }}>
          <TrendingUp size={15} color="var(--accent)" strokeWidth={2.5} />
        </div>
        <span className="logo-name">FinLearn</span>
      </div>
      <button className="hamburger" onClick={onSearchClick} aria-label="Pesquisar">
        <Search size={18} />
      </button>
    </header>
  )
}
