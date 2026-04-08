import { Link } from 'react-router-dom'
import { Check, ClipboardCheck } from 'lucide-react'
import ProgressBar from '../../components/ProgressBar.jsx'
import Badge from '../../components/Badge.jsx'
import ModuleIcon from '../../utils/moduleIcons.jsx'

export default function ModuleSection({ module, moduleProgress, quizScore, completedLessons }) {
  const percent   = moduleProgress?.percent || 0
  const completed = moduleProgress?.completed || 0
  const total     = moduleProgress?.total || 0

  return (
    <div className="module-section card" style={{ marginBottom: 20 }}>
      <div className="module-section-header">
        <span className="module-icon"><ModuleIcon icon={module.icon} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="module-section-title">Módulo {module.id} — {module.title}</h2>
          <p className="module-desc">{module.description}</p>
        </div>
        {quizScore && <Badge variant="success">Quiz {quizScore.percent}%</Badge>}
      </div>

      <ProgressBar percent={percent} style={{ margin: '12px 0 6px' }} />
      <div className="module-lesson-count" style={{ marginBottom: 16 }}>
        {completed}/{total} lições concluídas
      </div>

      <div className="lesson-list">
        {module.lessons?.map((lesson, i) => {
          const done = completedLessons.includes(lesson.id)
          return (
            <Link key={lesson.id} to={`/licao/${lesson.id}`} className={`lesson-list-item${done ? ' done' : ''}`}>
              <span className="lesson-number">{i + 1}</span>
              <span className="lesson-name">{lesson.title}</span>
              {done && <Check size={14} className="lesson-check" />}
            </Link>
          )
        })}
      </div>

      {percent === 100 && (
        <div style={{ marginTop: 16 }}>
          <Link to={`/quiz/${module.id}`} className="btn btn-primary btn-sm">
            <ClipboardCheck size={14} /> Fazer Quiz do Módulo
          </Link>
        </div>
      )}
    </div>
  )
}
