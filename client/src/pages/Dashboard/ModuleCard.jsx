import { Link } from 'react-router-dom'
import { Play, ClipboardCheck, CheckCircle2, Clock, Circle, BookOpen, Landmark, TrendingUp, Target, Zap, Receipt } from 'lucide-react'
import ProgressBar from '../../components/ProgressBar.jsx'
import Badge from '../../components/Badge.jsx'

const MODULE_ICONS = { book: BookOpen, landmark: Landmark, 'trending-up': TrendingUp, target: Target, zap: Zap, receipt: Receipt }
function ModuleIcon({ icon }) {
  const Icon = MODULE_ICONS[icon]
  return Icon ? <Icon size={22} color="var(--accent)" /> : null
}

export default function ModuleCard({ module, moduleProgress, quizScore, completedLessons }) {
  const percent   = moduleProgress?.percent || 0
  const completed = moduleProgress?.completed || 0
  const total     = moduleProgress?.total || module.lessons?.length || 0
  const firstLesson      = module.lessons?.[0]
  const firstIncomplete  = module.lessons?.find(l => !completedLessons.includes(l.id))
  const lessonLink = firstIncomplete
    ? `/licao/${firstIncomplete.id}`
    : firstLesson ? `/licao/${firstLesson.id}` : '/trilha'

  const StatusIcon  = percent === 100 ? CheckCircle2 : percent > 0 ? Clock : Circle
  const statusCls   = percent === 100 ? 'completed' : percent > 0 ? 'in-progress' : 'not-started'
  const statusLabel = percent === 100 ? 'Concluído' : percent > 0 ? 'Em andamento' : 'Não iniciado'

  return (
    <div className="module-card card">
      <div className="module-card-header">
        <span className="module-icon"><ModuleIcon icon={module.icon} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h3 className="module-title" style={{ margin: 0 }}>Módulo {module.id} — {module.title}</h3>
            <span className={`module-status ${statusCls}`}>
              <StatusIcon size={11} /> {statusLabel}
            </span>
          </div>
          <p className="module-desc">{module.description}</p>
        </div>
      </div>

      <ProgressBar percent={percent} style={{ margin: '14px 0 6px' }} />

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{completed}/{total} lições</span>
        {quizScore && <Badge variant="success">Quiz {quizScore.percent}%</Badge>}
      </div>

      <div className="button-group">
        <Link to={lessonLink} className="btn btn-primary btn-sm">
          <Play size={13} /> {percent === 100 ? 'Revisar' : percent > 0 ? 'Continuar' : 'Começar'}
        </Link>
        {percent === 100 && (
          <Link to={`/quiz/${module.id}`} className="btn btn-secondary btn-sm">
            <ClipboardCheck size={13} /> Fazer Quiz
          </Link>
        )}
      </div>
    </div>
  )
}
