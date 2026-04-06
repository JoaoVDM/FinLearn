import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getModules } from '../../services/api.js'
import { useProgress } from '../../context/ProgressContext.jsx'
import ModuleSection from './ModuleSection.jsx'
import Spinner from '../../components/Spinner.jsx'

export default function Trilha() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const { progress } = useProgress()
  const [searchParams] = useSearchParams()
  const sectionRefs = useRef({})

  useEffect(() => {
    getModules().then(data => {
      setModules(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const modId = searchParams.get('modulo')
    if (modId && sectionRefs.current[modId]) {
      setTimeout(() => sectionRefs.current[modId]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [searchParams, modules])

  if (loading || !progress) return <Spinner />

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h1>Trilha de Aprendizado</h1>
        <p>Siga os módulos em ordem para uma progressão ideal de aprendizado.</p>
      </div>
      {modules.map(mod => {
        const mp = progress.modulesProgress?.find(m => m.id === mod.id)
        const qs = progress.quizScores?.[mod.id]
        return (
          <div key={mod.id} ref={el => sectionRefs.current[mod.id] = el}>
            <ModuleSection
              module={mod}
              moduleProgress={mp}
              quizScore={qs}
              completedLessons={progress.completedLessons || []}
            />
          </div>
        )
      })}
    </div>
  )
}
