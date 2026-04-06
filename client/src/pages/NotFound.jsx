import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="not-found fade-in">
      <div className="not-found-code">404</div>
      <h2>Página não encontrada</h2>
      <p>O endereço que você acessou não existe.</p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
        <Home size={15} /> Voltar ao início
      </Link>
    </div>
  )
}
