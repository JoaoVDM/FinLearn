import { NavLink } from 'react-router-dom'
import { Home, BookOpen, BookMarked, Calculator, Target, Wallet, TrendingUp, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

const navLinks = [
  { to: '/',          label: 'Início',               Icon: Home,       end: true },
  { to: '/trilha',    label: 'Trilha de Aprendizado', Icon: BookOpen          },
  { to: '/glossario', label: 'Glossário',             Icon: BookMarked        },
  { to: '/simulador', label: 'Simulador',             Icon: Calculator        },
  { to: '/meta',      label: 'Calculadora de Metas',  Icon: Target            },
  { to: '/fluxo',     label: 'Fluxo de Caixa',        Icon: Wallet            },
]

export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <TrendingUp size={20} color="var(--accent)" />
        <span className="logo-text">FinLearn</span>
      </div>
      <nav className="sidebar-nav">
        {navLinks.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} className="nav-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark'
            ? <><Sun size={15} /> Tema Claro</>
            : <><Moon size={15} /> Tema Escuro</>
          }
        </button>
      </div>
    </aside>
  )
}
