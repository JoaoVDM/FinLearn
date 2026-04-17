import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Trilha from './pages/Trilha/Trilha.jsx'
import Licao from './pages/Licao/Licao.jsx'
import Quiz from './pages/Quiz/Quiz.jsx'
import QuizReview from './pages/Quiz/QuizReview.jsx'
import Glossario from './pages/Glossario.jsx'
import Simulador from './pages/Simulador/Simulador.jsx'
import Meta from './pages/Meta/Meta.jsx'
import Fluxo from './pages/Fluxo/Fluxo.jsx'
import Notas from './pages/Notas/Notas.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="trilha" element={<Trilha />} />
          <Route path="licao/:id" element={<Licao />} />
          <Route path="quiz/:modulo" element={<Quiz />} />
          <Route path="quiz/:modulo/revisao" element={<QuizReview />} />
          <Route path="glossario" element={<Glossario />} />
          <Route path="simulador" element={<Simulador />} />
          <Route path="meta" element={<Meta />} />
          <Route path="fluxo" element={<Fluxo />} />
          <Route path="notas" element={<Notas />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
