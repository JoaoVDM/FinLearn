import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import ProgressBar from '../../components/ProgressBar.jsx'
import { useProgress } from '../../context/ProgressContext.jsx'

export default function LessonSidebar({ lesson, currentId }) {
  const { progress } = useProgress()
  const completedLessons = progress?.completedLessons || []
  const mp = progress?.modulesProgress?.find(m => m.id === lesson.moduleId)

  return (
    <div className="lesson-sidebar">
      <div className="sidebar-card">
        <h3>Progresso do Módulo</h3>
        <ProgressBar percent={mp?.percent || 0} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {mp?.completed || 0}/{mp?.total || 0} lições ({mp?.percent || 0}%)
        </div>
      </div>
      <div className="sidebar-card">
        <h3>Lições do Módulo</h3>
        <div>
          {lesson.lessons?.map(l => {
            const done = completedLessons.includes(l.id)
            const active = l.id === currentId
            return (
              <Link
                key={l.id}
                to={`/licao/${l.id}`}
                className={`sidebar-lesson-item${active ? ' active' : ''}${done ? ' done' : ''}`}
              >
                <span className="sidebar-lesson-text">{l.title}</span>
                {active && <ChevronRight size={13} style={{ flexShrink: 0, color: 'var(--accent)' }} />}
                {!active && done && <Check size={13} style={{ flexShrink: 0, color: 'var(--accent)', opacity: 0.7 }} />}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
