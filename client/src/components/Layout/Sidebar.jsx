import { NavLink } from 'react-router-dom'
import { Home, BookOpen, BookMarked, Calculator, Target, Wallet, Sun, Moon, TrendingUp } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const NAV_MAIN = [
  { to: '/',       label: 'Início',               Icon: Home,       end: true },
  { to: '/trilha', label: 'Trilha',               Icon: BookOpen          },
]

const NAV_TOOLS = [
  { to: '/glossario', label: 'Glossário',          Icon: BookMarked },
  { to: '/simulador', label: 'Simulador',          Icon: Calculator },
  { to: '/meta',      label: 'Metas',              Icon: Target     },
  { to: '/fluxo',     label: 'Fluxo de Caixa',    Icon: Wallet     },
]

function NavGroup({ label, links, onClose }) {
  return (
    <div className="nav-group">
      {label && <span className="nav-group-label">{label}</span>}
      {links.map(({ to, label: lbl, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          onClick={onClose}
        >
          <Icon size={16} className="nav-icon" />
          <span>{lbl}</span>
        </NavLink>
      ))}
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon-wrap">
          <TrendingUp size={16} color="var(--accent)" strokeWidth={2.5} />
        </div>
        <span className="logo-text">FinLearn</span>
      </div>

      <nav className="sidebar-nav">
        <NavGroup links={NAV_MAIN} onClose={onClose} />
        <NavGroup label="Ferramentas" links={NAV_TOOLS} onClose={onClose} />
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === 'dark'
            ? <><Sun size={14} /> Tema Claro</>
            : <><Moon size={14} /> Tema Escuro</>
          }
        </button>
      </div>
    </aside>
  )
}
