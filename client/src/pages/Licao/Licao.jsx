import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Square, CheckSquare, ClipboardCheck } from 'lucide-react'
import { getLesson } from '../../services/api.js'
import { useProgress } from '../../context/ProgressContext.jsx'
import { showToast } from '../../components/Toast.jsx'
import LessonSidebar from './LessonSidebar.jsx'
import Spinner from '../../components/Spinner.jsx'

export default function Licao() {
  const { id } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const { progress, markLesson } = useProgress()

  useEffect(() => {
    setLoading(true)
    getLesson(id).then(data => {
      setLesson(data.error ? null : data)
      setLoading(false)
      window.scrollTo(0, 0)
    })
  }, [id])

  if (loading) return <div className="lesson-layout"><div className="lesson-main"><Spinner /></div></div>
  if (!lesson)  return <div className="lesson-layout"><div className="lesson-main"><p>Lição não encontrada.</p></div></div>

  const done        = progress?.completedLessons?.includes(id) || false
  const lessonIndex = lesson.lessons?.findIndex(l => l.id === id) ?? -1
  const prevLesson  = lessonIndex > 0 ? lesson.lessons[lessonIndex - 1] : null
  const nextLesson  = lessonIndex < (lesson.lessons?.length - 1) ? lesson.lessons[lessonIndex + 1] : null

  const handleCheck = async (e) => {
    const checked = e.target.checked
    await markLesson(id, checked)
    showToast(checked ? 'Lição marcada como concluída!' : 'Progresso removido')
  }

  return (
    <div className="lesson-layout">
      <div className="lesson-main">
        <div className="lesson-header">
          <div className="lesson-breadcrumb">
            <Link to="/trilha">Trilha</Link>
            <span>/</span>
            <Link to={`/trilha?modulo=${lesson.moduleId}`}>Módulo {lesson.moduleId} — {lesson.moduleTitle}</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-secondary)' }}>{lesson.title}</span>
          </div>
          <h1 className="lesson-title-main">{lesson.title}</h1>
        </div>

        <div className="lesson-body lesson-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />

        <label className="complete-label">
          {done
            ? <CheckSquare size={18} color="var(--accent)" />
            : <Square size={18} color="var(--text-muted)" />
          }
          <input type="checkbox" checked={done} onChange={handleCheck} style={{ display: 'none' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: done ? 'var(--accent)' : 'var(--text-secondary)' }}>
            {done ? 'Lição concluída' : 'Marcar como concluída'}
          </span>
          {done && <Check size={14} color="var(--accent)" />}
        </label>

        <div className="lesson-actions">
          {prevLesson
            ? <Link to={`/licao/${prevLesson.id}`} className="btn btn-secondary">
                <ChevronLeft size={16} /> {prevLesson.title}
              </Link>
            : <Link to={`/trilha?modulo=${lesson.moduleId}`} className="btn btn-secondary">
                <ChevronLeft size={16} /> Trilha
              </Link>
          }
          {nextLesson
            ? <Link to={`/licao/${nextLesson.id}`} className="btn btn-primary">
                {nextLesson.title} <ChevronRight size={16} />
              </Link>
            : <Link to={`/quiz/${lesson.moduleId}`} className="btn btn-primary">
                <ClipboardCheck size={15} /> Fazer Quiz do Módulo
              </Link>
          }
        </div>
      </div>

      <LessonSidebar lesson={lesson} currentId={id} />
    </div>
  )
}
