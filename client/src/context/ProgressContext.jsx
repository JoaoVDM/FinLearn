import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getProgress, postProgress, resetProgress as apiReset } from '../services/api.js'

const ProgressContext = createContext()

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    const data = await getProgress()
    if (data.error) {
      setError(true)
      return
    }
    setError(false)
    setProgress(data)
  }, [])

  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const markLesson = useCallback(async (lessonId, completed) => {
    await postProgress(lessonId, completed)
    await refresh()
  }, [refresh])

  const reset = useCallback(async () => {
    await apiReset()
    await refresh()
  }, [refresh])

  const contextValue = useMemo(
    () => ({ progress, error, refreshProgress: refresh, markLesson, resetProgress: reset }),
    [progress, error, refresh, markLesson, reset]
  )

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => useContext(ProgressContext)
