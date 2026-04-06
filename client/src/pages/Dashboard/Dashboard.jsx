import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, BookOpen, BookCheck, BarChart2, Trophy, Calculator, Target, Wallet, BookMarked, RotateCcw } from 'lucide-react'
import { useProgress } from '../../context/ProgressContext.jsx'
import { getModules } from '../../services/api.js'
import { showToast } from '../../components/Toast.jsx'
import ModuleCard from './ModuleCard.jsx'
import Spinner from '../../components/Spinner.jsx'
import ProgressBar from '../../components/ProgressBar.jsx'

const TOOLS = [
  { to: '/simulador', Icon: Calculator, label: 'Simulador de Juros',    desc: 'Calcule o crescimento do patrimônio' },
  { to: '/meta',      Icon: Target,     label: 'Calculadora de Metas',  desc: 'Descubra quanto poupar por mês'      },
  { to: '/fluxo',     Icon: Wallet,     label: 'Fluxo de Caixa',        desc: 'Controle gastos e investimentos'     },
  { to: '/glossario', Icon: BookMarked, label: 'Glossário',             desc: 'Termos do mercado financeiro'        },
]

export default function Dashboard() {
  const { progress, resetProgress } = useProgress()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getModules().then(data => {
      setModules(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  if (!progress || loading) return <Spinner />

  const totalLessons    = progress.modulesProgress?.reduce((a, m) => a + m.total, 0) || 0
  const completedCount  = progress.completedLessons?.length || 0
  const overallPercent  = totalLessons ? Math.round(completedCount / totalLessons * 100) : 0
  const quizzesDone     = Object.keys(progress.quizScores || {}).length

  let continueLink = '/trilha'
  for (const mod of modules) {
    const inc = mod.lessons?.find(l => !progress.completedLessons?.includes(l.id))
    if (inc) { continueLink = `/licao/${inc.id}`; break }
  }

  const handleReset = async () => {
    if (!confirm('Resetar todo o progresso? Esta ação não pode ser desfeita.')) return
    await resetProgress()
    showToast('Progresso resetado')
  }

  return (
    <div className="page-content fade-in">
      <div className="hero-section">
        <h1 className="hero-title">Bem-vindo ao FinLearn</h1>
        <p className="hero-subtitle">Sua jornada de educação financeira</p>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookCheck size={20} /> {completedCount}/{totalLessons}
            </span>
            <span className="stat-label">Lições concluídas</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart2 size={20} /> {overallPercent}%
            </span>
            <span className="stat-label">Progresso geral</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={20} /> {quizzesDone}/{modules.length}
            </span>
            <span className="stat-label">Quizzes feitos</span>
          </div>
        </div>

        <ProgressBar percent={overallPercent} style={{ marginBottom: 24, maxWidth: 440 }} />

        <div className="button-group">
          <Link to={continueLink} className="btn btn-primary">
            <Play size={15} /> Continuar Estudando
          </Link>
          <Link to="/trilha" className="btn btn-secondary">
            <BookOpen size={15} /> Ver Trilha Completa
          </Link>
        </div>
      </div>

      <section>
        <h2 className="section-title">Módulos</h2>
        <div className="modules-grid">
          {modules.map(mod => {
            const mp = progress.modulesProgress?.find(m => m.id === mod.id)
            const qs = progress.quizScores?.[mod.id]
            return (
              <ModuleCard
                key={mod.id}
                module={mod}
                moduleProgress={mp}
                quizScore={qs}
                completedLessons={progress.completedLessons || []}
              />
            )
          })}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 className="section-title">Ferramentas</h2>
        <div className="quick-links-grid">
          {TOOLS.map(({ to, Icon, label, desc }) => (
            <Link key={to} to={to} className="quick-link-card card">
              <Icon size={28} color="var(--accent)" className="quick-link-icon" />
              <div>
                <div className="quick-link-label">{label}</div>
                <div className="quick-link-desc">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleReset}>
          <RotateCcw size={14} /> Resetar todo o progresso
        </button>
      </div>
    </div>
  )
}
