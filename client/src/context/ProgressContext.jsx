import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getProgress, postProgress, resetProgress as apiReset } from '../services/api.js'

const ProgressContext = createContext()

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(null)

  const refresh = useCallback(async () => {
    const data = await getProgress()
    setProgress(data)
  }, [])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markLesson = async (lessonId, completed) => {
    await postProgress(lessonId, completed)
    await refresh()
  }

  const reset = async () => {
    await apiReset()
    await refresh()
  }

  return (
    <ProgressContext.Provider value={{ progress, refreshProgress: refresh, markLesson, resetProgress: reset }}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => useContext(ProgressContext)
