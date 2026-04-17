import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

export function useThemeChart() {
  const { theme } = useTheme()
  return useMemo(() => ({
    tickColor:    theme === 'dark' ? 'rgba(232,240,254,0.55)' : '#64748b',
    gridColor:    theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    legendColor:  theme === 'dark' ? 'rgba(232,240,254,0.75)' : '#334155',
    tooltipBg:    theme === 'dark' ? '#1a2235' : '#ffffff',
    tooltipText:  theme === 'dark' ? '#e8f0fe' : '#1e293b',
    tooltipBorder:theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    accentColor:  '#00C896',
    accentLight:  'rgba(0,200,150,0.12)',
    secondaryColor: '#6366f1',
    secondaryLight: 'rgba(99,102,241,0.12)',
  }), [theme])
}
