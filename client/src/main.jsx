import React from 'react'
import ReactDOM from 'react-dom/client'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, ArcElement } from 'chart.js'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ProgressProvider } from './context/ProgressContext.jsx'
import './styles/global.css'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, ArcElement)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24,
          fontFamily: 'system-ui, sans-serif', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#00e5b4' }}>Ops!</div>
          <h2 style={{ margin: 0, color: '#e8f0fe' }}>Algo deu errado</h2>
          <p style={{ color: 'rgba(232,240,254,0.55)', margin: 0, maxWidth: 360 }}>
            Ocorreu um erro inesperado. Você pode tentar recarregar a página.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 24px', background: '#00e5b4', color: '#03180e',
              border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            Voltar ao início
          </button>
          {import.meta.env.DEV && (
            <pre style={{ fontSize: '0.75rem', color: '#ff4466', textAlign: 'left', maxWidth: 640, overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
