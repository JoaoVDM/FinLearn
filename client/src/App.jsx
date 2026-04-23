import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout.jsx'
import Spinner from './components/Spinner.jsx'

const Dashboard   = lazy(() => import('./pages/Dashboard/Dashboard.jsx'))
const Trilha      = lazy(() => import('./pages/Trilha/Trilha.jsx'))
const Licao       = lazy(() => import('./pages/Licao/Licao.jsx'))
const Quiz        = lazy(() => import('./pages/Quiz/Quiz.jsx'))
const QuizReview  = lazy(() => import('./pages/Quiz/QuizReview.jsx'))
const Glossario   = lazy(() => import('./pages/Glossario.jsx'))
const Simulador   = lazy(() => import('./pages/Simulador/Simulador.jsx'))
const Meta        = lazy(() => import('./pages/Meta/Meta.jsx'))
const Fluxo       = lazy(() => import('./pages/Fluxo/Fluxo.jsx'))
const Notas       = lazy(() => import('./pages/Notas/Notas.jsx'))
const NotFound    = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
          <Route path="trilha" element={<Suspense fallback={<Spinner />}><Trilha /></Suspense>} />
          <Route path="licao/:id" element={<Suspense fallback={<Spinner />}><Licao /></Suspense>} />
          <Route path="quiz/:modulo" element={<Suspense fallback={<Spinner />}><Quiz /></Suspense>} />
          <Route path="quiz/:modulo/revisao" element={<Suspense fallback={<Spinner />}><QuizReview /></Suspense>} />
          <Route path="glossario" element={<Suspense fallback={<Spinner />}><Glossario /></Suspense>} />
          <Route path="simulador" element={<Suspense fallback={<Spinner />}><Simulador /></Suspense>} />
          <Route path="meta" element={<Suspense fallback={<Spinner />}><Meta /></Suspense>} />
          <Route path="fluxo" element={<Suspense fallback={<Spinner />}><Fluxo /></Suspense>} />
          <Route path="notas" element={<Suspense fallback={<Spinner />}><Notas /></Suspense>} />
          <Route path="anotacoes" element={<Navigate to="/notas" replace />} />
          <Route path="*" element={<Suspense fallback={<Spinner />}><NotFound /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
