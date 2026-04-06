import { useTheme } from '../context/ThemeContext.jsx'

export function useThemeChart() {
  const { theme } = useTheme()
  return {
    tickColor: theme === 'dark' ? '#5a6478' : '#94a3b8',
    gridColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    legendColor: theme === 'dark' ? '#8892a4' : '#475569',
    tooltipBg: theme === 'dark' ? '#1a1e2a' : '#ffffff',
    tooltipText: theme === 'dark' ? '#e8eaf0' : '#1e293b',
    accentColor: '#00C896',
    accentLight: 'rgba(0,200,150,0.15)',
    secondaryColor: '#6366f1',
    secondaryLight: 'rgba(99,102,241,0.15)',
  }
}
