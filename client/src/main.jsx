import React from 'react'
import ReactDOM from 'react-dom/client'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, ArcElement } from 'chart.js'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ProgressProvider } from './context/ProgressContext.jsx'
import './styles/global.css'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend, ArcElement)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </ThemeProvider>
  </React.StrictMode>
)
